import { provideRouter, Route } from '@angular/router';
import { AdminLoginComponent } from './pages/admin-login/admin-login.component';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { ItemsListComponent } from './pages/items-list/items-list.component';

const routes: Route[] = [
    { path: '', component: ItemsListComponent },
    { path: 'admin/login', component: AdminLoginComponent },
    { path: 'admin/dashboard', component: AdminDashboardComponent },
    { path: '**', redirectTo: '' }
];

export const appRoutingProviders = [];
export const appRouter = provideRouter(routes);
