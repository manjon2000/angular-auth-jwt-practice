import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '@core/auth';
import { environment } from '@env/environment';
import { authInterceptor } from './auth.interceptor';
import { errorInterceptor } from './error.interceptor';
import { isApiRequest } from './is-api-request';

const API_URL = `${environment.apiUrl}/items`;

describe('interceptors', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let signOut: ReturnType<typeof vi.fn>;
  let token: string | null;

  beforeEach(() => {
    signOut = vi.fn();
    token = 'abc';
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { getToken: () => token, signOut } },
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  describe('authInterceptor', () => {
    function authorizationFor(url: string): string | null {
      http.get(url).subscribe();
      const request = controller.expectOne(url);
      request.flush({});
      return request.request.headers.get('Authorization');
    }

    it('adds the token to API requests', () => {
      expect(authorizationFor(API_URL)).toBe('Bearer abc');
    });

    it('does not send the token to other domains', () => {
      expect(authorizationFor('https://third-party.com/data')).toBeNull();
    });

    it('does not send the token to a domain that only starts like the API', () => {
      expect(authorizationFor(`${environment.apiUrl}.evil.com/data`)).toBeNull();
    });

    it('sends nothing without a valid token', () => {
      token = null;
      expect(authorizationFor(API_URL)).toBeNull();
    });
  });

  describe('errorInterceptor', () => {
    function failWith(url: string, status: number): unknown {
      let received: unknown;
      http.get(url).subscribe({ error: (e: unknown) => (received = e) });
      controller.expectOne(url).flush({}, { status, statusText: 'Error' });
      return received;
    }

    it('signs out on a 401 from the API and rethrows', () => {
      expect(failWith(API_URL, 401)).toMatchObject({ status: 401 });
      expect(signOut).toHaveBeenCalledOnce();
    });

    it('ignores a 401 from other domains', () => {
      failWith('https://third-party.com/data', 401);
      expect(signOut).not.toHaveBeenCalled();
    });

    it('does not sign out on other errors', () => {
      expect(failWith(API_URL, 500)).toMatchObject({ status: 500 });
      expect(signOut).not.toHaveBeenCalled();
    });
  });

  it('isApiRequest accepts the API root', () => {
    expect(isApiRequest(environment.apiUrl)).toBe(true);
  });
});
