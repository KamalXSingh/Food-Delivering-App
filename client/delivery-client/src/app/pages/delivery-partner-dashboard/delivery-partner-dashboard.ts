import { Component,OnInit,signal,OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeliveryPartnerService } from '../../services/delivery-partner.service';
import { DeliveryRequestService } from '../../services/delivery-request.service';
import { SocketService } from '../../services/socket';

@Component({
  selector: 'app-delivery-partner-dashboard',
  imports: [CommonModule],
  templateUrl: './delivery-partner-dashboard.html',
  styleUrl: './delivery-partner-dashboard.css',
})
export class DeliveryPartnerDashboard implements OnInit,OnDestroy {

  partnerId = '6aaa94c922f639fe28c0a9fc';
  // 6a95398b6edb8eb8fe144c50
  // 6aaa949322f639fe28c0a9fa
  //6aaa94a022f639fe28c0a9fb 
  //6a953a7a8f89c4f6b0a11f02 
  //6aaa94c922f639fe28c0a9fc
  //6aaa94e322f639fe28c0a9fd
  //6aaa94c922f639fe28c0a9fc


  otp = signal('');
  otpError = signal('');


  currentOrder = signal<any>(null);
  requests = signal<any[]>([]);
  loading = signal(false);
  errorMessage = signal('');

  constructor(private deliveryParnterService: DeliveryPartnerService,
              private deliveryRequestService: DeliveryRequestService,
              private socketService : SocketService
  ){}

  ngOnInit(){

    this.socketService.connect();
    this.socketService.joinPartner(this.partnerId);

    this.socketService.on('order:updated',this.handleOrderUpdated);
    this.socketService.on(
    'new-delivery-request',
    this.handleNewDeliveryRequest
  );

    this.loadRequests();
    this.loadCurrentOrder();
  }

  private handleOrderUpdated = (event: {
  orderId: string;
  status?: string;
}): void => {
  console.log('Order updated:', event);

  this.loadCurrentOrder();
};

  private handleNewDeliveryRequest = (event:{
    partnerId: string,
    requestId: string,
  }): void=>{
    console.log('New delivery request received: ',event);

    if(event.partnerId === this.partnerId){
      this.loadRequests();
    }
  }

  ngOnDestroy(): void {
  this.socketService.off(
    'new-delivery-request',
    this.handleNewDeliveryRequest
  );
  this.socketService.off(
  'order:updated',
  this.handleOrderUpdated
);

  this.socketService.leavePartner(this.partnerId);
}

  loadRequests(){
    this.loading.set(true);
    this.errorMessage.set('');

    this.deliveryParnterService
      .getPartnerRequests(this.partnerId)
      .subscribe({

        next: (response: any) => {

          console.log('Delivery requests:', response);

          this.requests.set(response.requests || []);

          this.loading.set(false);
        },
        

        error: (error) => {

          console.error('Failed to load delivery requests:', error);

          this.errorMessage.set(
            error.error?.message || 'Failed to load delivery requests'
          );

          this.loading.set(false);
        }

      });

  }

  acceptRequest(requestId: string) {

  this.deliveryRequestService.acceptRequest(requestId).subscribe({

    next: (response: any) => {

      console.log('Request accepted:', response);

      this.loadRequests();
    },

    error: (error) => {

      console.error('Accept request error:', error);

      this.errorMessage.set(
        error.error?.message || 'Failed to accept request'
      );
    }

  });
}

  rejectRequest(requestId: string) {

  this.deliveryRequestService.rejectRequest(requestId).subscribe({

    next: (response: any) => {

      console.log('Request rejected:', response);

      this.loadRequests();
    },

    error: (error) => {

      console.error('Reject request error:', error);

      this.errorMessage.set(
        error.error?.message || 'Failed to reject request'
      );
    }

  });
}

loadCurrentOrder(): void {

  this.deliveryParnterService
    .getCurrentOrder(this.partnerId)
    .subscribe({

      next: (response: any) => {

        console.log('Current order:', response);

        this.currentOrder.set(response.order || null);
      },

      error: (error) => {

        console.error('Failed to load current order:', {
          status: error.status,
          backendMessage: error.error?.message,
          fullError: error
        });

        if (error.status === 404) {
          this.currentOrder.set(null);
        }
      }

    });
}


startPickup() {

  const orderId = this.currentOrder()?._id;

  if (!orderId) {
    return;
  }

  this.deliveryParnterService.startPickup(orderId).subscribe({

    next: (response: any) => {

      console.log('Pickup started:', response);

      this.loadCurrentOrder();
    },

    error: (error) => {

      console.error('Start pickup error:', error);
      console.log('Backend message:', error.error?.message);

      this.errorMessage.set(
        error.error?.message || 'Failed to start pickup'
      );
    }

  });
}

arriveAtRestaurant() {

  const orderId = this.currentOrder()?._id;

  if (!orderId) {
    return;
  }

  this.deliveryParnterService.arriveAtRestaurant(orderId).subscribe({

    next: (response: any) => {

      console.log('Rider arrived at restaurant:', response);

      this.loadCurrentOrder();
    },

    error: (error) => {

      console.error('Arrive at restaurant error:', error);

      this.errorMessage.set(
        error.error?.message || 'Failed to mark arrival'
      );
    }

  });
}

markOrderPickedUp() {

  const orderId = this.currentOrder()?._id;

  if (!orderId) {
    return;
  }

  this.deliveryParnterService.markOrderPickedUp(orderId).subscribe({

    next: (response: any) => {

      console.log('Order picked up:', response);

      // Dev/testing OTP
      if (response.otp) {
        console.log('Customer OTP:', response.otp);
      }

      this.loadCurrentOrder();
    },

    error: (error) => {

      console.error('Pickup order error:', error);

      this.errorMessage.set(
        error.error?.message || 'Failed to pick up order'
      );
    }

  });
}

startDelivery() {

  const orderId = this.currentOrder()?._id;

  if (!orderId) {
    return;
  }

  this.deliveryParnterService.startDelivery(orderId).subscribe({

    next: (response: any) => {

      console.log('Delivery started:', response);

      this.loadCurrentOrder();
    },

    error: (error) => {

      console.error('Start delivery error:', error);

      this.errorMessage.set(
        error.error?.message || 'Failed to start delivery'
      );
    }

  });
}

verifyOtp() {

  const orderId = this.currentOrder()?._id;
  const enteredOtp = this.otp();

  if (!orderId || !enteredOtp) {
    return;
  }

  this.otpError.set('');

  this.deliveryParnterService
    .verifyDeliveryOtp(orderId, enteredOtp)
    .subscribe({

      next: (response: any) => {

        console.log('OTP verified:', response);

        this.otp.set('');

        this.loadCurrentOrder();
      },

      error: (error) => {

        console.error('OTP verification error:', error);

        this.otpError.set(
          error.error?.message || 'Invalid OTP'
        );
      }

    });
}



}

