import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../services/order.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-customer-dashboard',
  imports: [CommonModule,RouterLink],
  templateUrl: './customer-dashboard.html',
  styleUrl: './customer-dashboard.css',
})
export class CustomerDashboard implements OnInit {

  customerId = '6a93e517be00af62771effd3';
  // 6a95398b6edb8eb8fe144c50
  // 6a93e517be00af62771effd3
  restaurantId = '6a94756eb0a997600ab4c0f9';

  // Signals
  orderCreated = signal(false);
  order = signal<any>(null);
  orders = signal<any[]>([]);

  loading = signal(false);
  errorMessage = signal('');

  constructor(private orderService: OrderService) {}

  ngOnInit() {
    this.loadOrders();
  }

  // Load all orders for this customer
  loadOrders() {
    this.orderService.getCustomerOrders(this.customerId).subscribe({
      next: (response: any) => {
        console.log('Customer orders:', response);

        this.orders.set(response.orders || []);
      },

      error: (error) => {
        console.error('Load orders error:', error);

        this.errorMessage.set(
          error.error?.message || 'Failed to load orders'
        );
      }
    });
  }

  // Place a new order
  placeOrder() {

    this.loading.set(true);
    this.errorMessage.set('');

    const newOrder = {

      customerId: this.customerId,

      restaurantId: this.restaurantId,

      items: [
        {
          name: 'Margherita Pizza',
          quantity: 2,
          price: 299
        },
        {
          name: 'Garlic Bread',
          quantity: 1,
          price: 149
        }
      ],

      deliveryAddress: {
        addressLine: '25 Green Park',
        city: 'Meerut',
        state: 'Uttar Pradesh',
        postalCode: '250001',
        latitude: 28.9895,
        longitude: 77.7014
      }
    };

    this.orderService.createOrder(newOrder).subscribe({

      next: (response: any) => {

        console.log('Order created:', response);

        // Store the newly created order
        this.order.set(response.order);

        // Show current order section
        this.orderCreated.set(true);

        // Stop loading
        this.loading.set(false);

        // Refresh order history
        this.loadOrders();
      },

      error: (error) => {

        console.error('Create order error:', error);

        this.errorMessage.set(
          error.error?.message || 'Failed to place order'
        );

        this.loading.set(false);
      }
    });
  }
}