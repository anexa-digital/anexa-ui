# @anexa/ui

Kit de UI compartido de las aplicaciones de Anexa Digital: tokens de diseño con modo claro/oscuro y
paletas, controles, grillas (`DataGrid` en memoria y `ServerGrid` paginada por el servidor), shell con
menú y barra de estado, gráficas de simulación, diálogos, toasts y textos es-CO. Código fuente TSX + CSS
sin paso de build: Bun lo compila dentro de cada app.

**Licencia propietaria.** El repositorio es visible para facilitar la instalación como dependencia,
pero el código solo puede usarse en aplicaciones de Anexa Digital y de sus clientes bajo contrato.
Ver [`LICENSE`](LICENSE).

Guía de adopción (montar una app sobre el kit, contrato de la API, trabajo diario):
[`docs/ADOPCION.md`](docs/ADOPCION.md).

## Instalar

Por **tag**, con Bun:

```bash
bun add github:anexa-digital/anexa-ui#v0.3.0
```

Los peers se declaran con versión exacta en la app: `react`/`react-dom` 19.3.0,
`@tanstack/react-query` 5.104.1, `@tanstack/react-router` 1.170.42, `@tanstack/react-table` 8.21.3,
`@tanstack/react-virtual` 3.14.21. El `bun.lock` fija el tag y el commit.

Para desarrollo local sin publicar: `bun link` en este repo y `bun link @anexa/ui` en la app. Ese
estado nunca se commitea.

## Usar

```css
/* src/index.css de la app */
@import "tailwindcss";
@import "@anexa/ui/styles.css";
@source "../node_modules/@anexa/ui/src";
@custom-variant dark {
  &:where([data-theme="dark"], [data-theme="dark"] *) { @slot; }
  @media (prefers-color-scheme: dark) { &:where([data-theme="system"], [data-theme="system"] *) { @slot; } }
}
```

```ts
import { AppShell, NavMenu, ServerGrid, extendMessages, registerErrorMessages, t } from "@anexa/ui";
extendMessages("es-CO", appMessages);       // textos del dominio de la app
registerErrorMessages({ my_code: "error.key" });
```

- Textos: todo pasa por `t()`. El kit trae los suyos (`grid.*`, `ui.*`, `theme.*`, `system.*`,
  `error.*`, `charts.*`, `login.*`, `nav.{home,logout,menu,menuShort,account}`, `common.*`,
  `statusBar.*`); la app agrega los de su dominio con `extendMessages` **antes** de que se evalúe
  cualquier pantalla.
- API: `request`, `getJson`, `postForFile`, `postForm` y `ApiError`. Mismo origen: el servidor Bun
  de la app proxya `/v1/*` y guarda la sesión en cookie HttpOnly.
- Grillas: `DataGrid` (filas en memoria) y `ServerGrid` (el servidor ordena y pagina; filtros desde
  `GET /v1/lists/{name}`, exportación Excel por `POST /v1/lists/xlsx`).
- Tema: `data-theme` y `data-palette` en `<html>`; `index.html` los aplica antes del primer pintado
  desde `localStorage` (`anexa_theme`, `anexa_palette`).
- Gráficas: `import { ... } from "@anexa/ui/charts"`.

## Contribuir y publicar

Lo nuevo entra aquí, no en la app. `bun run typecheck` y `bun test` deben pasar. Nada de secretos,
hosts, nombres de clientes ni datos de negocio: el kit es genérico.

```bash
# 1. subir "version" en package.json al mismo número del tag
# 2. commit y tag
git tag vX.Y.Z && git push origin master --tags
# 3. en cada app
bun add github:anexa-digital/anexa-ui#vX.Y.Z
```

Las dependencias Git no pasan por `minimumReleaseAge` (no hay registro npm); el control de edad queda
en los peers.
