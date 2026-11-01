import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forbidden',
  imports: [RouterLink],
  template: `
    <div class="page">
      <h1>Acceso denegado</h1>
      <p>No tienes permiso para ver esta página.</p>
      <a class="link" routerLink="/dashboard">Volver al inicio</a>
    </div>
  `,
})
export class ForbiddenPage {}
