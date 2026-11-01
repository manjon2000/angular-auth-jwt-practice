import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { filter, fromEvent, map, Observable } from 'rxjs';
import { TOKEN_KEY } from '../constants';
import { JwtPayload, Session, User } from '../types';
import { decodeJwtPayload, isJwtExpired } from '../utils';
import { FakeAuthApi } from './fake/fake-auth.api';
import { TokenStorage } from './token-storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(FakeAuthApi);
  private readonly router = inject(Router);
  private readonly storage = inject(TokenStorage);
  private readonly _session = signal<Session | null>(this.loadSession());
  private expiryTimer?: ReturnType<typeof setTimeout>;

  readonly currentUser = computed<User | null>(() => {
    const session = this._session();
    return session ? this.toUser(session.payload) : null;
  });
  readonly role = computed(() => this.currentUser()?.role ?? null);

  constructor() {
    this.scheduleExpiry();
    inject(DestroyRef).onDestroy(() => clearTimeout(this.expiryTimer));

    fromEvent<StorageEvent>(window, 'storage')
      .pipe(
        filter(({ key }) => key === TOKEN_KEY || key === null),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.syncFromStorage());
  }

  signInWithEmailAndPassword(email: string, password: string): Observable<User> {
    return this.api.login(email, password).pipe(
      map(({ token }) => {
        const session = this.toSession(token);
        this.storage.set(token);
        this.setSession(session);
        return this.toUser(session.payload);
      }),
    );
  }

  signOut(): void {
    this.storage.remove();
    this.setSession(null);
    void this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return this.getToken() !== null;
  }

  getToken(): string | null {
    const session = this._session();
    return session && !isJwtExpired(session.payload) ? session.token : null;
  }

  private loadSession(): Session | null {
    const token = this.storage.get();
    if (!token) return null;

    try {
      return this.toSession(token);
    } catch {
      this.storage.remove();
      return null;
    }
  }

  private toSession(token: string): Session {
    const payload = decodeJwtPayload(token);
    if (isJwtExpired(payload)) throw new Error('Token caducado');
    return { token, payload };
  }

  private syncFromStorage(): void {
    const wasLoggedIn = this.isLoggedIn();
    this.setSession(this.loadSession());
    if (wasLoggedIn && !this.isLoggedIn()) void this.router.navigate(['/login']);
  }

  private setSession(session: Session | null): void {
    this._session.set(session);
    this.scheduleExpiry();
  }

  private scheduleExpiry(): void {
    clearTimeout(this.expiryTimer);

    const session = this._session();
    if (!session) return;

    const remainingMs = session.payload.exp * 1000 - Date.now();
    this.expiryTimer = setTimeout(() => this.signOut(), remainingMs);
  }

  private toUser({ name, email, role }: JwtPayload): User {
    return { name, email, role };
  }
}
