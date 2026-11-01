import { Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class SocketService {

  private socket: Socket = io('http://localhost:3000', {
    autoConnect: false
  });
  

  connected = signal(false);
  connectionError = signal('');

  constructor() {

    // Successful connection
    this.socket.on('connect', () => {
      this.connected.set(true);
      this.connectionError.set('');

      console.log('Socket.IO connected:', this.socket.id);
    });

    // Connection lost
    this.socket.on('disconnect', (reason) => {
      this.connected.set(false);

      console.log('Socket.IO disconnected:', reason);
    });

    // Connection failed
    this.socket.on('connect_error', (error) => {
      this.connected.set(false);
      this.connectionError.set(error.message);

      console.error('Socket.IO connection error:', error.message);
    });
  }

  connect(): void {
    if (!this.socket.connected) {
      this.socket.connect();
    }
  }

  disconnect(): void {
    this.socket.disconnect();
  }

  //Methods
  joinOrder(orderId: string): void{
    console.log('Sending join-order event:', orderId);
    this.socket.emit('join-order',orderId);
  }
  leaveOrder(orderId: string): void{
    this.socket.emit('leave-order',orderId)
  }

  joinRestaurant(restaurantId: string): void {
  this.socket.emit('join-restaurant', restaurantId);
  }

  leaveRestaurant(restaurantId: string): void {
  this.socket.emit('leave-restaurant', restaurantId);
  }

  joinPartner(partnerId: string): void {
  this.socket.emit('join-partner', partnerId);
}

leavePartner(partnerId: string): void {
  this.socket.emit('leave-partner', partnerId);
}

  on<T>(eventName: string, callback: (data: T) => void): void {
    this.socket.on(eventName, callback);
  }

  off<T>(eventName: string, callback: (data: T) => void): void {
    this.socket.off(eventName, callback);
  }

  emit(eventName: string, data?: unknown): void {
    this.socket.emit(eventName, data);
  }
}