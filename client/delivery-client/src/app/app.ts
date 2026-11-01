import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ApiService } from './services/api.service';
import { response } from 'express';
import { error } from 'console';
import { SocketService } from './services/socket';

import { CustomerDashboard } from './pages/customer-dashboard/customer-dashboard';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  
  serverMessage = '';

  constructor(private apiService: ApiService,
    private socketService: SocketService
  ){}

  ngOnInit(){

    this.socketService.connect();
    this.apiService.getServiceMessage().subscribe({
      next:(response)=>{
        this.serverMessage = response;
      },
      error:(error)=>{
        console.log('API error', error);
      }
    })
  }

}
