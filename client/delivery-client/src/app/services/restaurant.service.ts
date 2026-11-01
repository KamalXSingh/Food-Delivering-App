import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class RestaurantService {
  private apiUrl = 'http://localhost:3000/api/restaurants';
  private apiUrlAccept='http://localhost:3000/api'

  constructor(private http: HttpClient){}

  // http://localhost:3000/api/orders/6a95266bf8fd053ab2d77db0/accept

  acceptOrder(orderId: string, preparationTime: number) {
  return this.http.patch(
    `${this.apiUrlAccept}/orders/${orderId}/accept`,
    { preparationTime }
  );
}

  getRestaurantOrders(restaurantId: string){
    return this.http.get(`${this.apiUrl}/${restaurantId}/orders`);
  }

  markOrderReady(orderId: string){
    return this.http.patch(`${this.apiUrl}/orders/${orderId}/ready`,{});
  }
}
