import { Component, OnInit, signal,OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RestaurantService } from '../../services/restaurant.service';
import { SocketService } from '../../services/socket';
import { response } from 'express';

@Component({
  selector: 'app-restaurant-dashboard',
  imports: [CommonModule],
  templateUrl: './restaurant-dashboard.html',
  styleUrl: './restaurant-dashboard.css',
})
export class RestaurantDashboard implements OnInit,OnDestroy {

  restaurantId = '6a94756eb0a997600ab4c0f9';

  orders = signal<any[]>([]);
  loading = signal(false);
  errorMessage = signal('');

  constructor(
    private restaurantService: RestaurantService,
    private socketService: SocketService
  ) {}

  ngOnInit(): void {

    this.socketService.connect();

    console.log('Joining restaurant room:', this.restaurantId);
    this.socketService.joinRestaurant(this.restaurantId);

    this.socketService.on('order:updated',this.handleOrderUpdated);
    this.socketService.on('new-order',this.handleNewOrder);

    this.loadOrders();
  }

  private handleOrderUpdated = (event: { orderId: string }): void => {
  console.log('Order updated:', event.orderId);
  this.loadOrders();
};

  private handleNewOrder = (event:{
    restaurantId: string;
    orderId: string;
  }): void =>{
    if(event.restaurantId === this.restaurantId){
      console.log('New order received',event.orderId);
      this.loadOrders();
    }
  }

  acceptOrder(orderId: string, preparationTime: number) {

  this.restaurantService.acceptOrder(
    orderId,
    preparationTime
  ).subscribe({

    next: (response: any) => {

      console.log('Order accepted:', response);

      this.loadOrders();
    },

    error: (error) => {

      console.error('Accept order error:', error);

      this.errorMessage.set(
        error.error?.message || 'Failed to accept order'
      );
    }

  });
}

  markOrderReady(orderId: string): void {
  this.errorMessage.set('');

  this.restaurantService.markOrderReady(orderId).subscribe({
    next: (response: any) => {
      console.log('Order marked ready:', response);
      this.loadOrders();
    },

    error: (error) => {
      console.error('Failed to mark order ready:', error);

      this.errorMessage.set(
        error.error?.message || 'Failed to mark order ready'
      );
    }
  });
}

  loadOrders() {

    this.loading.set(true);
    this.errorMessage.set('');

    this.restaurantService.getRestaurantOrders(this.restaurantId).subscribe({

      next: (response: any) => {

        console.log('Restaurant orders:', response);

        this.orders.set(response.orders || []);

        this.loading.set(false);
      },

      error: (error) => {

        console.error('Failed to load restaurant orders:', error);

        this.errorMessage.set(
          error.error?.message || 'Failed to load orders'
        );

        this.loading.set(false);
      }

    });
  }
  ngOnDestroy(): void {
  this.socketService.off('new-order', this.handleNewOrder);
  this.socketService.off('order:updated', this.handleOrderUpdated);

  this.socketService.leaveRestaurant(this.restaurantId);
}
}