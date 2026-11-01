import { Routes } from '@angular/router';
import { OrderDetails } from './pages/order-details/order-details';
import { CustomerDashboard } from './pages/customer-dashboard/customer-dashboard';
import { Order } from './order';
import { RestaurantDashboard } from './pages/restaurant-dashboard/restaurant-dashboard';
import { DeliveryPartnerDashboard } from './pages/delivery-partner-dashboard/delivery-partner-dashboard';

export const routes: Routes = [
    {
        path: '',
        component: CustomerDashboard
    },
    {
        path:'order/:id',
        component: OrderDetails
    },
    {
        path:'restaurant',
        component:RestaurantDashboard
    },
    {
        path:'delivery-partner',
        component:DeliveryPartnerDashboard
    }
];
