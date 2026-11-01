import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class DeliveryRequestService {
   private apiUrl = 'http://localhost:3000/api/delivery-requests';

   constructor(private http: HttpClient) {}

  // getPartnerRequests(partnerId: string) {
  //   return this.http.get(
  //     `${this.apiUrl}/partner/${partnerId}`
  //   );
  // }
  acceptRequest(requestId: string) {
    return this.http.patch(
      `${this.apiUrl}/${requestId}/accept`,
      {}
    );
  }
  rejectRequest(requestId: string) {
    return this.http.patch(
      `${this.apiUrl}/${requestId}/reject`,
      {}
    );
  }
  
}
