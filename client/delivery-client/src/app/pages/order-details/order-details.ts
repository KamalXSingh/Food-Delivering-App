import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { SocketService } from '../../services/socket';

@Component({
  selector: 'app-order-details',
  imports: [CommonModule],
  templateUrl: './order-details.html',
  styleUrl: './order-details.css',
})
export class OrderDetails implements OnInit, OnDestroy {

  orderId = signal('');
  order = signal<any>(null);

  loading = signal(false);
  errorMessage = signal('');

  orderSteps = [
    { status: 'PLACED', label: 'Order Placed' },
    { status: 'RESTAURANT_ACCEPTED', label: 'Restaurant Accepted' },
    { status: 'SEARCHING_FOR_PARTNER', label: 'Searching for Delivery Partner' },
    { status: 'PARTNER_REQUESTED', label: 'Partner Requested' },
    { status: 'PARTNER_ACCEPTED', label: 'Partner Accepted' },
    { status: 'PREPARING', label: 'Preparing' },
    // { status: 'RIDER_GOING_TO_RESTAURANT', label: 'Rider Going to Restaurant' },
    { status: 'RIDER_ARRIVED', label: 'Rider Arrived' },
    { status: 'READY_FOR_PICKUP', label: 'Ready for Pickup' },
    { status: 'PICKED_UP', label: 'Picked Up' },
    { status: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
    { status: 'DELIVERED', label: 'Delivered' }
  ];

  currentStepIndex = computed(() => {
    const currentStatus = this.order()?.status;

    return this.orderSteps.findIndex(
      step => step.status === currentStatus
    );
  });

  constructor(
    private route: ActivatedRoute,
    private orderService: OrderService,
    private socketService: SocketService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.errorMessage.set('Order ID is missing from the URL.');
      return;
    }

    this.orderId.set(id);

    console.log('Joining order room:', id);

  
    

    // Subscribe to this order's room.
    this.socketService.joinOrder(id);

    this.socketService.on(
      'order:updated',
      this.handleOrderUpdated
    );

    // Fetch the initial order data through HTTP.
    this.loadOrder();
  }

  private handleOrderUpdated = (
    event: { orderId: string }
  ): void => {
    if (event.orderId === this.orderId()) {
      this.loadOrder();
    }
  };

  loadOrder(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.orderService.getOrder(this.orderId()).subscribe({
      next: (response: any) => {
        this.order.set(response.order);
        this.loading.set(false);
      },

      error: (error) => {
        console.error('Failed to load order:', error);

        this.errorMessage.set(
          error.error?.message || 'Failed to load order'
        );

        this.loading.set(false);
      }
    });
  }

  ngOnDestroy(): void {
    // Stop listening when this page is destroyed.
    this.socketService.off(
      'order:updated',
      this.handleOrderUpdated
    );

    // Leave the room for this order.
    if (this.orderId()) {
      this.socketService.leaveOrder(this.orderId());
    }
  }
}