import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { AuthService } from '@core/auth';
import { NEVER, of, throwError } from 'rxjs';
import { LoginPage } from './login';

describe('LoginPage', () => {
  let fixture: ComponentFixture<LoginPage>;
  let signIn: ReturnType<typeof vi.fn>;
  let navigateByUrl: ReturnType<typeof vi.spyOn>;

  async function setup(queryParams: Record<string, string> = {}): Promise<void> {
    signIn = vi.fn(() => of({ name: 'Ana', email: 'ana@test.com', role: 'USER' }));
    TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { signInWithEmailAndPassword: signIn } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap(queryParams) } },
        },
      ],
    });
    navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    fixture = TestBed.createComponent(LoginPage);
    await fixture.whenStable();
  }

  const el = (): HTMLElement => fixture.nativeElement;

  function type(selector: string, value: string): void {
    const input = el().querySelector<HTMLInputElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  async function submit(email = 'ana@test.com', password = '1234'): Promise<void> {
    type('#email', email);
    type('#password', password);
    el().querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  }

  it('does not call the API and shows errors when the form is invalid', async () => {
    await setup();

    await submit('not-an-email', '');

    expect(signIn).not.toHaveBeenCalled();
    expect(el().querySelector('#email-error')?.textContent).toContain('email válido');
    expect(el().querySelector('#password-error')?.textContent).toContain('tu contraseña');
  });

  it('links each invalid field to its error for assistive technology', async () => {
    await setup();

    await submit('not-an-email', '');

    const email = el().querySelector('#email')!;
    expect(email.getAttribute('aria-invalid')).toBe('true');
    expect(email.getAttribute('aria-describedby')).toBe('email-error');
  });

  it('moves focus to the first invalid field', async () => {
    await setup();
    document.body.appendChild(el());

    await submit('ana@test.com', '');

    expect(document.activeElement?.id).toBe('password');
    el().remove();
  });

  it('shows the demo credentials', async () => {
    await setup();

    expect(el().querySelector('.alert--info')?.textContent).toContain('admin@test.com');
  });

  it('signs in and goes to /dashboard by default', async () => {
    await setup();

    await submit();

    expect(signIn).toHaveBeenCalledWith('ana@test.com', '1234');
    expect(navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });

  it('returns to the requested url after signing in', async () => {
    await setup({ returnUrl: '/dashboard/admin' });

    await submit();

    expect(navigateByUrl).toHaveBeenCalledWith('/dashboard/admin');
  });

  it('ignores a returnUrl that is not an internal path', async () => {
    await setup({ returnUrl: 'https://evil.com' });

    await submit();

    expect(navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });

  it('explains a 401', async () => {
    await setup();
    signIn.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 401 })));

    await submit();

    expect(el().querySelector('[role=alert]')?.textContent).toContain('incorrectos');
    expect(navigateByUrl).not.toHaveBeenCalled();
  });

  it('shows a generic message on any other failure and allows retrying', async () => {
    await setup();
    signIn.mockReturnValue(throwError(() => new Error('boom')));

    await submit();

    expect(el().querySelector('[role=alert]')?.textContent).toContain('No se ha podido');
    expect(el().querySelector('button')!.getAttribute('aria-disabled')).toBe('false');
  });

  it('ignores a second submit while the first is in flight', async () => {
    await setup();
    signIn.mockReturnValue(NEVER);

    await submit();
    await submit();

    expect(signIn).toHaveBeenCalledOnce();
    expect(el().querySelector('button')!.getAttribute('aria-disabled')).toBe('true');
    expect(el().querySelector('[role=status]')?.textContent).toContain('Iniciando sesión');
  });
});
