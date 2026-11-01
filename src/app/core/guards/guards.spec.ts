import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  provideRouter,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { AuthService, Role } from '@core/auth';
import { authGuard } from './auth.guard';
import { guestGuard } from './guest.guard';
import { roleGuard } from './role.guard';

describe('guards', () => {
  const loggedIn = signal(false);
  const role = signal<Role | null>(null);

  function run(guard: CanActivateFn, url = '/dashboard'): string | boolean {
    const result = TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot),
    );
    return typeof result === 'boolean'
      ? result
      : TestBed.inject(Router).serializeUrl(result as never);
  }

  beforeEach(() => {
    loggedIn.set(false);
    role.set(null);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { isLoggedIn: loggedIn, role } },
      ],
    });
  });

  describe('authGuard', () => {
    it('allows a valid session', () => {
      loggedIn.set(true);
      expect(run(authGuard)).toBe(true);
    });

    it('redirects to /login keeping the requested url', () => {
      expect(run(authGuard, '/dashboard/admin')).toBe('/login?returnUrl=%2Fdashboard%2Fadmin');
    });
  });

  describe('guestGuard', () => {
    it('allows a visitor without a valid session', () => {
      expect(run(guestGuard)).toBe(true);
    });

    it('sends a signed in user to /dashboard', () => {
      loggedIn.set(true);
      expect(run(guestGuard)).toBe('/dashboard');
    });
  });

  describe('roleGuard', () => {
    it('allows an accepted role', () => {
      role.set('ADMIN');
      expect(run(roleGuard(['ADMIN']))).toBe(true);
    });

    it.each(['USER', null] as const)('sends role %s to /forbidden', (value) => {
      role.set(value);
      expect(run(roleGuard(['ADMIN']))).toBe('/forbidden');
    });
  });
});
