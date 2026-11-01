import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';
import { TOKEN_KEY } from './core/auth/constants';
import { createFakeJwt } from './core/auth/services/fake/fake-jwt.util';
import { Role } from './core/auth/types';

describe('app routes', () => {
  function signInAs(role: Role): void {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    localStorage.setItem(
      TOKEN_KEY,
      createFakeJwt({ sub: '1', name: 'Ana', email: 'ana@test.com', role, exp }),
    );
  }

  async function visit(url: string): Promise<{ url: string; text: string }> {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url);
    return {
      url: TestBed.inject(Router).url,
      text: (harness.routeNativeElement as HTMLElement).textContent ?? '',
    };
  }

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
  });

  afterEach(() => localStorage.clear());

  it('sends a visitor from / to the login page', async () => {
    const page = await visit('/');
    expect(page.url).toBe('/login?returnUrl=%2Fdashboard');
    expect(page.text).toContain('Iniciar sesión');
  });

  it('sends an unknown url to the login page when signed out', async () => {
    expect((await visit('/does-not-exist')).url).toContain('/login');
  });

  it('shows the dashboard to a signed in user', async () => {
    signInAs('USER');
    const page = await visit('/');
    expect(page.url).toBe('/dashboard');
    expect(page.text).toContain('Hola, Ana');
  });

  it('keeps a signed in user out of the login page', async () => {
    signInAs('USER');
    expect((await visit('/login')).url).toBe('/dashboard');
  });

  it('sends a USER away from the admin page', async () => {
    signInAs('USER');
    const page = await visit('/dashboard/admin');
    expect(page.url).toBe('/forbidden');
    expect(page.text).toContain('Acceso denegado');
  });

  it.each([
    ['USER', '/dashboard', 'Dashboard'],
    ['ADMIN', '/dashboard/admin', 'Administración'],
    ['USER', '/forbidden', 'Acceso denegado'],
  ] as const)('gives %s at %s the page title %s', async (role, url, title) => {
    signInAs(role);
    await visit(url);
    expect(TestBed.inject(Title).getTitle()).toContain(title);
  });

  it('lets an ADMIN into the admin page', async () => {
    signInAs('ADMIN');
    const page = await visit('/dashboard/admin');
    expect(page.url).toBe('/dashboard/admin');
    expect(page.text).toContain('Administración');
  });
});
