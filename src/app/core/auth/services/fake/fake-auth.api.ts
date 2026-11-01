import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, timer } from 'rxjs';
import { JwtResponse } from '../../types';
import { createFakeJwt } from './fake-jwt.util';
import { FAKE_USERS, SERVER_ERROR_EMAIL } from './fake-users.data';

const LATENCY_MS = 500;

@Injectable({ providedIn: 'root' })
export class FakeAuthApi {
  login(email: string, password: string): Observable<JwtResponse> {
    return timer(LATENCY_MS).pipe(map(() => this.authenticate(email, password)));
  }

  private authenticate(email: string, password: string): JwtResponse {
    if (email === SERVER_ERROR_EMAIL) throw new HttpErrorResponse({ status: 500 });

    const user = FAKE_USERS.find((u) => u.email === email && u.password === password);
    if (!user) throw new HttpErrorResponse({ status: 401 });

    return {
      token: createFakeJwt({
        sub: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + user.tokenLifetimeSeconds,
      }),
    };
  }
}
