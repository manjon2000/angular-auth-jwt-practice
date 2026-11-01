import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { firstValueFrom, Observable, of } from 'rxjs';
import { TOKEN_KEY } from '../constants';
import { JwtPayload, JwtResponse } from '../types';
import { AuthService } from './auth.service';
import { FakeAuthApi } from './fake/fake-auth.api';
import { createFakeJwt } from './fake/fake-jwt.util';

const NOW_MS = 1_800_000_000_000;
const NOW_S = NOW_MS / 1000;

function tokenFor(overrides: Partial<JwtPayload> = {}): string {
  return createFakeJwt({
    sub: '1',
    name: 'Ana',
    email: 'ana@test.com',
    role: 'USER',
    exp: NOW_S + 60,
    ...overrides,
  });
}

describe('AuthService', () => {
  let login: ReturnType<typeof vi.fn<() => Observable<JwtResponse>>>;
  let navigate: ReturnType<typeof vi.fn>;

  function createService(): AuthService {
    return TestBed.inject(AuthService);
  }

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW_MS);
    localStorage.clear();

    login = vi.fn(() => of({ token: tokenFor() }));
    navigate = vi.fn(() => Promise.resolve(true));
    TestBed.configureTestingModule({
      providers: [
        { provide: FakeAuthApi, useValue: { login } },
        { provide: Router, useValue: { navigate } },
      ],
    });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
  });

  describe('sign in', () => {
    it('stores the token and exposes the user', async () => {
      const auth = createService();

      const user = await firstValueFrom(auth.signInWithEmailAndPassword('a', 'b'));

      expect(user).toEqual({ name: 'Ana', email: 'ana@test.com', role: 'USER' });
      expect(auth.isLoggedIn()).toBe(true);
      expect(auth.role()).toBe('USER');
      expect(localStorage.getItem(TOKEN_KEY)).toBe(auth.getToken());
    });

    it('rejects a token that is already expired', async () => {
      login.mockReturnValue(of({ token: tokenFor({ exp: NOW_S - 1 }) }));
      const auth = createService();

      await expect(firstValueFrom(auth.signInWithEmailAndPassword('a', 'b'))).rejects.toThrow(
        'caducado',
      );

      expect(auth.isLoggedIn()).toBe(false);
      expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    });
  });

  describe('session restore', () => {
    it('restores a valid token', () => {
      localStorage.setItem(TOKEN_KEY, tokenFor());
      expect(createService().isLoggedIn()).toBe(true);
    });

    it.each([
      ['expired', tokenFor({ exp: NOW_S - 1 })],
      ['corrupt', 'corrupt-token'],
    ])('discards a %s token', (_name, token) => {
      localStorage.setItem(TOKEN_KEY, token);

      expect(createService().isLoggedIn()).toBe(false);
      expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    });
  });

  describe('expiry', () => {
    it('signs out when the token expires', () => {
      localStorage.setItem(TOKEN_KEY, tokenFor());
      const auth = createService();

      vi.advanceTimersByTime(59_000);
      expect(auth.isLoggedIn()).toBe(true);

      vi.advanceTimersByTime(1_000);
      expect(auth.isLoggedIn()).toBe(false);
      expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
      expect(navigate).toHaveBeenCalledWith(['/login']);
    });

    it('stops reporting a session once the clock passes exp, even if the timer has not fired', () => {
      localStorage.setItem(TOKEN_KEY, tokenFor());
      const auth = createService();

      vi.setSystemTime(NOW_MS + 120_000);

      expect(auth.isLoggedIn()).toBe(false);
      expect(auth.getToken()).toBeNull();
    });

    it('cancels the pending expiry on sign out', () => {
      localStorage.setItem(TOKEN_KEY, tokenFor());
      const auth = createService();

      auth.signOut();
      navigate.mockClear();
      vi.advanceTimersByTime(60_000);

      expect(navigate).not.toHaveBeenCalled();
    });
  });

  describe('other tabs', () => {
    function storageEvent(key: string | null): void {
      window.dispatchEvent(new StorageEvent('storage', { key }));
    }

    it.each([[TOKEN_KEY], [null]])('signs out when key %s is cleared elsewhere', (key) => {
      localStorage.setItem(TOKEN_KEY, tokenFor());
      const auth = createService();

      localStorage.removeItem(TOKEN_KEY);
      storageEvent(key);

      expect(auth.isLoggedIn()).toBe(false);
      expect(navigate).toHaveBeenCalledWith(['/login']);
    });

    it('picks up a sign in from another tab without navigating', () => {
      const auth = createService();

      localStorage.setItem(TOKEN_KEY, tokenFor());
      storageEvent(TOKEN_KEY);

      expect(auth.isLoggedIn()).toBe(true);
      expect(navigate).not.toHaveBeenCalled();
    });

    it('ignores changes to other keys', () => {
      localStorage.setItem(TOKEN_KEY, tokenFor());
      const auth = createService();

      localStorage.removeItem(TOKEN_KEY);
      storageEvent('other');

      expect(auth.isLoggedIn()).toBe(true);
    });
  });

  it('signOut clears the session and goes to /login', () => {
    localStorage.setItem(TOKEN_KEY, tokenFor());
    const auth = createService();

    auth.signOut();

    expect(auth.currentUser()).toBeNull();
    expect(auth.getToken()).toBeNull();
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });
});
