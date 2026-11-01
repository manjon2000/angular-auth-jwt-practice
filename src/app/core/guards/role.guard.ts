import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, Role } from '@core/auth';

export const roleGuard =
  (allowedRoles: readonly Role[]): CanActivateFn =>
  () => {
    const role = inject(AuthService).role();

    return role && allowedRoles.includes(role)
      ? true
      : inject(Router).createUrlTree(['/forbidden']);
  };
