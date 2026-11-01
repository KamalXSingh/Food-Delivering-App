import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private apiUrl = 'http://localhost:3000/api/orders';

  constructor(private http:HttpClient) {}

  createOrder(order: any){
    return this.http.post(this.apiUrl,order)
  }

  getOrder(orderId: string){
    return this.http.get(`${this.apiUrl}/${orderId}`)
  }

  getCustomerOrders(customerId: string){
    return this.http.get(`http://localhost:3000/api/users/${customerId}/orders`);
  }
}
