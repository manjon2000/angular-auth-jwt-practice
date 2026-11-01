import { JwtPayload, ROLES } from '../types';

export function isJwtPayload(value: unknown): value is JwtPayload {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;

  return (
    typeof v['sub'] === 'string' &&
    typeof v['name'] === 'string' &&
    typeof v['email'] === 'string' &&
    typeof v['exp'] === 'number' &&
    (ROLES as readonly unknown[]).includes(v['role'])
  );
}

function decodeBase64Url(value: string): string {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  const bytes = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function decodeJwtPayload(token: string): JwtPayload {
  const part = token.split('.')[1];
  if (!part) throw new Error('Token con formato inválido');

  const payload: unknown = JSON.parse(decodeBase64Url(part));
  if (!isJwtPayload(payload)) throw new Error('Payload del token inválido');
  return payload;
}

export function isJwtExpired({ exp }: JwtPayload): boolean {
  return exp * 1000 <= Date.now();
}
