import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '@core/auth';
import { catchError, throwError } from 'rxjs';
import { isApiRequest } from './is-api-request';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && isApiRequest(req.url)) {
        auth.signOut();
      }
      return throwError(() => error);
    }),
  );
};
