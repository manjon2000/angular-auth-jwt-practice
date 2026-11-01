import { createFakeJwt } from '../services/fake/fake-jwt.util';
import { JwtPayload } from '../types';
import { decodeJwtPayload, isJwtExpired, isJwtPayload } from './jwt.util';

const payload: JwtPayload = {
  sub: '1',
  name: 'Ana Muñoz 😀',
  email: 'ana@test.com',
  role: 'USER',
  exp: 2_000_000_000,
};

describe('jwt.util', () => {
  describe('decodeJwtPayload', () => {
    it('decodes a valid token, including non-ASCII characters', () => {
      expect(decodeJwtPayload(createFakeJwt(payload))).toEqual(payload);
    });

    it('rejects a token without a payload part', () => {
      expect(() => decodeJwtPayload('not-a-jwt')).toThrow('formato inválido');
    });

    it('rejects a payload that is not base64', () => {
      expect(() => decodeJwtPayload('a.%%%.c')).toThrow();
    });

    it('rejects a payload with an unknown role', () => {
      const token = createFakeJwt({ ...payload, role: 'ROOT' as JwtPayload['role'] });
      expect(() => decodeJwtPayload(token)).toThrow('Payload del token inválido');
    });
  });

  describe('isJwtPayload', () => {
    it.each([null, 'text', 1, {}, { ...payload, exp: '2000000000' }, { ...payload, sub: 1 }])(
      'rejects %j',
      (value) => {
        expect(isJwtPayload(value)).toBe(false);
      },
    );
  });

  describe('isJwtExpired', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(1_000_000_000);
    });
    afterEach(() => vi.useRealTimers());

    it('is false before exp', () => {
      expect(isJwtExpired({ ...payload, exp: 1_000_001 })).toBe(false);
    });

    it('is true exactly at exp', () => {
      expect(isJwtExpired({ ...payload, exp: 1_000_000 })).toBe(true);
    });
  });
});
