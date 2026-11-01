import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class DeliveryPartnerService {
  private apiUrl = 'http://localhost:3000/api/delivery-partners/'

  constructor(private http: HttpClient){}

  // createUser(order: any){
  //   return this.http.post(`${this.apiUrl}`,order);
  // }

  getPartnerRequests(partnerId:string){
    return this.http.get(
      `${this.apiUrl.replace('delivery-partners', 'delivery-requests')}partner/${partnerId}`
    );
  }

  getCurrentOrder(partnerId: string) {
  return this.http.get(
    `${this.apiUrl}${partnerId}/current-order`
  );
}

  startPickup(orderId: string) {
    return this.http.patch(
      `${this.apiUrl}orders/${orderId}/start-pickup`,
      {}
    );
  }
   arriveAtRestaurant(orderId: string) {
    return this.http.patch(
      `${this.apiUrl}orders/${orderId}/arrive`,
      {}
    );
  }
  markOrderPickedUp(orderId: string) {
    return this.http.patch(
      `${this.apiUrl}orders/${orderId}/pickup`,
      {}
    );
  }
  startDelivery(orderId: string) {
    return this.http.patch(
      `${this.apiUrl}orders/${orderId}/start-delivery`,
      {}
    );
  }
  verifyDeliveryOtp(orderId: string, otp: string) {
    return this.http.patch(
      `${this.apiUrl}orders/${orderId}/verify-otp`,
      { otp }
    );
  }
}
