# Autenticación con Angular

Demo de un flujo de autenticación con JWT: login, sesión persistente, caducidad, rutas protegidas por rol y sincronización entre pestañas. No tiene backend: una API simulada genera los tokens en el propio navegador.

**Stack:** Angular 22 (signals, sin NgModules), TypeScript 6, RxJS, Vitest, ESLint y Prettier.

## Índice

- [Puesta en marcha](#puesta-en-marcha)
- [Comandos](#comandos)
- [Estructura](#estructura)
- [Rutas](#rutas)
- [Cómo funciona la sesión](#cómo-funciona-la-sesión)
- [Interceptores](#interceptores)
- [Estilos](#estilos)
- [Accesibilidad](#accesibilidad)
- [Publicar en GitHub Pages](#publicar-en-github-pages)
- [Seguridad](#seguridad)

## Puesta en marcha

```bash
npm install
npm start
```

La aplicación queda disponible en <http://localhost:4200>.

| Email              | Contraseña | Qué ocurre                                                    |
| ------------------ | ---------- | ------------------------------------------------------------- |
| `admin@test.com`   | `1234`     | Entra con rol `ADMIN` y puede abrir la administración         |
| `user@test.com`    | `1234`     | Entra con rol `USER`; la administración le da acceso denegado |
| `expired@test.com` | `1234`     | Recibe un token caducado y el login lo rechaza                |
| `fail@test.com`    | cualquiera | Simula un error 500 del servidor                              |

## Comandos

| Comando                | Qué hace                                                      |
| ---------------------- | ------------------------------------------------------------- |
| `npm start`            | Servidor de desarrollo                                        |
| `npm test`             | Tests en modo watch (`-- --watch=false` para una sola pasada) |
| `npm run lint`         | ESLint                                                        |
| `npm run format`       | Formatea `src` con Prettier                                   |
| `npm run format:check` | Comprueba el formato sin modificar nada                       |
| `npm run build`        | Build optimizado en `dist/`                                   |

[GitHub Actions](.github/workflows/ci.yml) ejecuta formato, lint, tests y build en cada push y pull request.

## Estructura

La regla principal es que `features` depende de `core`, nunca al revés.

```text
src/styles                      Estilos globales (patrón 7-1)
src/app
├── core                        Lo transversal a toda la aplicación
│   ├── auth
│   │   ├── services
│   │   │   ├── auth.service.ts           Estado de la sesión
│   │   │   ├── token-storage.service.ts  Acceso a localStorage
│   │   │   └── fake                      API simulada y usuarios de prueba
│   │   ├── constants
│   │   ├── types
│   │   ├── utils                         Decodificación y validación del JWT
│   │   └── index.ts                      API pública: se importa desde @core/auth
│   ├── guards
│   └── interceptors
├── features                    Las pantallas, cargadas de forma diferida
│   ├── auth                    Login
│   ├── dashboard               Dashboard y administración
│   └── forbidden               Acceso denegado
├── app.config.ts
└── app.routes.ts
```

Alias de TypeScript: `@core/*` y `@env/*`.

## Rutas

| Ruta               | Acceso                   | Si no se cumple                     |
| ------------------ | ------------------------ | ----------------------------------- |
| `/login`           | Sin sesión               | Redirige a `/dashboard`             |
| `/dashboard`       | Con sesión               | Redirige a `/login?returnUrl=<url>` |
| `/dashboard/admin` | Con sesión y rol `ADMIN` | Redirige a `/forbidden`             |
| `/forbidden`       | Público                  | —                                   |

`/` y cualquier ruta desconocida redirigen a `/dashboard`. Tras iniciar sesión, el login vuelve a la URL indicada en `returnUrl`.

## Cómo funciona la sesión

1. `LoginPage` llama a `AuthService.signInWithEmailAndPassword()`.
2. `AuthService` pide el token a `FakeAuthApi`, valida el payload y rechaza el token si ya ha caducado.
3. Guarda el token en `localStorage` y actualiza su signal privado, del que se derivan `currentUser` y `role`.
4. Al recargar la página, la sesión se restaura desde `localStorage`. Un token caducado o corrupto se descarta.

`isLoggedIn()` comprueba la caducidad cada vez que se llama, así que acierta aunque el equipo haya estado en reposo.

La sesión termina cuando:

- El usuario cierra sesión.
- El token llega a su `exp`, mediante un temporizador.
- Se cierra la sesión en otra pestaña, mediante el evento `storage`.

## Interceptores

**Ahora mismo no se ejecutan**, porque la API simulada no hace peticiones HTTP y la aplicación no hace ninguna otra. Están registrados en `app.config.ts` y tienen tests:

- `authInterceptor` añade `Authorization: Bearer <token>` solo a las peticiones dirigidas a `apiUrl`, para no filtrar el token a terceros.
- `errorInterceptor` cierra la sesión ante un 401 de `apiUrl` y relanza el error.

## Estilos

Los estilos son globales y siguen el patrón 7-1 de Sass. `src/styles/main.scss` importa cada carpeta con `@use`:

| Carpeta      | Contenido                                                |
| ------------ | -------------------------------------------------------- |
| `abstracts`  | Variables y mixins; no generan CSS                       |
| `vendors`    | Estilos de terceros; ahora está vacía                    |
| `themes`     | Colores como variables CSS, en modo claro y oscuro       |
| `base`       | Reset, tipografía y reglas globales de foco y movimiento |
| `layout`     | Estructura: `app`, `site-header`, `site-footer`, `page`  |
| `components` | `alert`, `button`, `field`, `link`, `skip-link`…         |
| `pages`      | Lo específico de una página: `login`, `dashboard`        |

- **BEM:** las clases siguen `bloque__elemento--modificador` y se anidan con `&`.
- **Mobile first:** los estilos base son para móvil y se amplían con `@include from('md')`, que usa `min-width`. No se usa `max-width` en las media queries.
- **Foco:** el mixin `focus-ring` aplica un `outline` de 3 px con `outline-offset: 4px`. Se activa en todo elemento de formulario al recibir foco, con teclado o con ratón, y en los enlaces con foco de teclado.

## Accesibilidad

El objetivo es cumplir WCAG 2.2 AA:

- **Estructura:** regiones `header`, `main` y `footer`, un `h1` por página, un título de página por ruta y `lang="es"`.
- **Teclado:** enlace para saltar al contenido, y foco en `main` al cambiar de ruta para que los lectores de pantalla no se queden en la página anterior.
- **Formularios:** etiquetas visibles que indican los campos obligatorios, errores asociados con `aria-describedby` y `aria-invalid`, y foco en el primer campo inválido al enviar.
- **Estados:** el envío se anuncia con `role="status"` y los errores del servidor con `role="alert"`. El botón usa `aria-disabled` en vez de `disabled`, para no perder el foco mientras se envía.
- **Visual:** contraste AA en ambos temas, objetivos táctiles de 44 px, sin scroll horizontal a 320 px y respeto de `prefers-reduced-motion`.
- **Tiempo:** el token dura 24 horas, por encima de las 20 que exige el criterio 2.2.1 para no tener que avisar antes de cerrar la sesión.

## Publicar en GitHub Pages

[`deploy.yml`](.github/workflows/deploy.yml) pasa los tests y publica la aplicación en cada push a `main` o `master`.

Solo hay que activarlo una vez: en **Settings → Pages → Source**, elige **GitHub Actions**. La aplicación queda en `https://<usuario>.github.io/<repositorio>/`.

## Seguridad

Esto es una demo y no debe protegerse con ella nada real:

- Los usuarios y la contraseña están en el código publicado, y los tokens llevan una firma falsa.
- Cualquiera puede editar `localStorage` y darse el rol `ADMIN`, porque el navegador no puede verificar la firma. Con un backend real, sería este quien autorizase cada petición.
- `localStorage` queda expuesto a cualquier XSS.
