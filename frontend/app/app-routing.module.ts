import { provideRouter, Route } from '@angular/router';
import { AdminLoginComponent } from './pages/admin-login/admin-login.component';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { ItemsListComponent } from './pages/items-list/items-list.component';
import { LoginScreenComponent } from './pages/login-screen/login-screen.component';
import { StudentDashboardComponent } from './pages/student-dashboard/student-dashboard.component';

const routes: Route[] = [
    { path: '', component: LoginScreenComponent },
    { path: 'student/dashboard', component: StudentDashboardComponent },
    { path: 'admin/login', component: AdminLoginComponent },
    { path: 'admin/dashboard', component: AdminDashboardComponent },
    { path: 'items', component: ItemsListComponent },
    { path: '**', redirectTo: '' }
];

export const appRoutingProviders = [];
export const appRouter = provideRouter(routes);
