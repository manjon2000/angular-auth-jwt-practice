import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    title: 'Iniciar sesión | Autenticación con Angular',
    loadComponent: () => import('./pages/login/login').then((m) => m.LoginPage),
  },
];
