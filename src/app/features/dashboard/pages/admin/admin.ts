import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin',
  imports: [RouterLink],
  template: `
    <div class="page">
      <h1>Administración</h1>
      <p>Solo los administradores llegan a esta página.</p>
      <a class="link" routerLink="/dashboard">Volver al dashboard</a>
    </div>
  `,
})
export class AdminPage {}
