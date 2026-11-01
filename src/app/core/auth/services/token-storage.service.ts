import { Injectable } from '@angular/core';
import { TOKEN_KEY } from '../constants';

@Injectable({ providedIn: 'root' })
export class TokenStorage {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  set(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  remove(): void {
    localStorage.removeItem(TOKEN_KEY);
  }
}
