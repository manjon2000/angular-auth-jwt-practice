import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/auth';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  template: `
    <div class="page dashboard">
      <h1>Hola, {{ auth.currentUser()?.name }}</h1>
      <p>Tu rol es {{ auth.role() }}.</p>
      <div class="dashboard__actions">
        <nav aria-label="Secciones">
          <a class="link" routerLink="admin">Administración</a>
        </nav>
        <button class="button button--secondary" type="button" (click)="auth.signOut()">
          Cerrar sesión
        </button>
      </div>
    </div>
  `,
})
export class DashboardPage {
  protected readonly auth = inject(AuthService);
}
