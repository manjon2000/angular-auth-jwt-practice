import { JwtPayload } from '../../types';

function encodeJwtPart(obj: object): string {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  const binary = Array.from(bytes, (b) => String.fromCharCode(b)).join('');

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function createFakeJwt(payload: JwtPayload): string {
  const header = encodeJwtPart({ alg: 'HS256', typ: 'JWT' });
  return `${header}.${encodeJwtPart(payload)}.fake-signature`;
}
