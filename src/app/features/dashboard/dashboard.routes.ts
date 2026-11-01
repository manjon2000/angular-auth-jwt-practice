import { Routes } from '@angular/router';
import { roleGuard } from '@core/guards/role.guard';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    title: 'Dashboard | Autenticación con Angular',
    loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.DashboardPage),
  },
  {
    path: 'admin',
    title: 'Administración | Autenticación con Angular',
    canActivate: [roleGuard(['ADMIN'])],
    loadComponent: () => import('./pages/admin/admin').then((m) => m.AdminPage),
  },
];
