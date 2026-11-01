import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { decodeJwtPayload } from '../../utils';
import { FakeAuthApi } from './fake-auth.api';

describe('FakeAuthApi', () => {
  const api = new FakeAuthApi();

  async function subjectOf(email: string): Promise<string> {
    const { token } = await firstValueFrom(api.login(email, '1234'));
    return decodeJwtPayload(token).sub;
  }

  async function statusOf(email: string, password: string): Promise<number> {
    const error = await firstValueFrom(api.login(email, password)).catch((e: unknown) => e);
    return (error as HttpErrorResponse).status;
  }

  it('keeps the same subject across logins', async () => {
    expect(await subjectOf('user@test.com')).toBe(await subjectOf('user@test.com'));
  });

  it('fails with 401 on wrong credentials', async () => {
    expect(await statusOf('user@test.com', 'wrong')).toBe(401);
  });

  it('fails with 500 in the server-error scenario', async () => {
    expect(await statusOf('fail@test.com', '1234')).toBe(500);
  });

  it('returns an already expired token in the expired scenario', async () => {
    const { token } = await firstValueFrom(api.login('expired@test.com', '1234'));
    expect(decodeJwtPayload(token).exp * 1000).toBeLessThan(Date.now());
  });

  it('does no work until subscribed', () => {
    const find = vi.spyOn(Array.prototype, 'find');

    api.login('user@test.com', '1234');

    expect(find).not.toHaveBeenCalled();
    find.mockRestore();
  });
});
