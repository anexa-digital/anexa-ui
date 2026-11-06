# Adoptar `@anexa/ui` en una aplicación

Un solo kit para todas las apps de Anexa Digital: se **copia tal cual** desde este paquete y nunca
se reimplementa. Lo que falte se agrega aquí, se publica un tag y cada app sube la referencia.

## 0. Instalación y acceso

```json
"@anexa/ui": "github:anexa-digital/anexa-ui#v0.3.0"
```

Bun descarga el tarball del tag por la API de GitHub; no hace falta `git` ni llaves. El `bun.lock`
registra el tag **y** el commit, así que `bun install --frozen-lockfile` falla a propósito si el tag se
mueve. En CI conviene exportar `GITHUB_TOKEN` (en GitHub Actions, `${{ secrets.GITHUB_TOKEN }}`) en el
paso de instalación: Bun lo usa y así no se depende del límite anónimo de la API de GitHub.

## 1. Prerrequisitos de la app

- Bun 1.4.x (imagen `oven/bun:1.4.x-slim`), TypeScript estricto, React 19.3.
- TanStack en las versiones peer del `package.json` del kit (query, router, table, virtual), con
  versión exacta.
- Tailwind 4 con `bun-plugin-tailwind`; `bunfig.toml` con `minimumReleaseAge = 604800` y `exact = true`.
- Nada de shadcn, base-ui, radix ni dnd-kit: las pantallas se construyen solo con el kit.

## 2. Cableado mínimo

1. **CSS** (`src/index.css`):
   ```css
   @import "tailwindcss";
   @import "@anexa/ui/styles.css";
   @source "../node_modules/@anexa/ui/src";
   @custom-variant dark {
     &:where([data-theme="dark"], [data-theme="dark"] *) { @slot; }
     @media (prefers-color-scheme: dark) { &:where([data-theme="system"], [data-theme="system"] *) { @slot; } }
   }
   ```
   Los tokens y el aspecto base de los controles vienen de `@anexa/ui/styles.css`; la app no los
   redefine. Estilo exclusivo de la app se queda en la app; lo general se lleva al kit.
2. **`index.html`**: antes del primer pintado aplica `data-theme` (`light` por defecto, `dark` o
   `system`) y `data-palette` (`indigo` por defecto; `classic`, `graphite`, `petrol`) leyendo
   `localStorage` con las claves `anexa_theme` y `anexa_palette`. `lib/theme.ts` del kit usa las
   mismas claves y defaults.
3. **Textos**: un módulo `src/i18n/register.ts` con `extendMessages("es-CO", esCO)` y, si aplica,
   `registerErrorMessages({ codigo_de_la_api: "error.clave" })`, importado **primero** en `main.tsx`
   (los labels de columnas se evalúan al cargar módulos). El catálogo de la app solo trae claves de su
   dominio; las del kit no se duplican. `app.name` se sobreescribe con el nombre de la app.
4. **Shell**: `AppShell` recibe `name`, `nav` (`NavMenu` con `NavSection[]`), `right` (usuario,
   selector de empresa, «Cerrar sesión») y `footer` (`StatusBar` con `health`).
5. **Servidor Bun de la app** (`server.ts`): sirve el bundle, proxya `/v1/*` a la API quitando el
   prefijo, guarda los tokens de `/auth/token` en cookies HttpOnly y reintenta una vez tras un 401
   renovando el par. El navegador nunca ve un token.
6. **Docker**: etapa de build `oven/bun:1.4.x-slim` con `COPY package.json bun.lock bunfig.toml` +
   `bun install --frozen-lockfile` + `bun run build`; imagen final solo con `dist/` y `server.ts`.

## 3. Contrato que la API debe cumplir

- `GET /liveness` y `GET /readiness` (la app los consume como `/v1/liveness` y `/v1/readiness`), con
  las formas `Liveness` / `Readiness` del kit; readiness responde aun con la base caída (503 aceptado).
- Errores como `{ "code": "...", "detail": ... }`. `errorMessage()` muestra el `detail` en texto si
  viene; si no, traduce el `code` con el catálogo (`registerErrorMessages` para los propios).
- Si se usa `ServerGrid` con filtros o exportación: `GET /v1/lists/{name}` (metadatos de la lista:
  columnas filtrables y sus valores) y `POST /v1/lists/xlsx` (exportación).
- Autenticación por `/auth/token` que el `server.ts` traduce a cookies.

## 4. Migrar una app que ya tenía estos componentes copiados

1. Instalar el kit y los peers con versión exacta.
2. Borrar de la app lo que ahora viene del kit (misma ruta relativa que en `src/` del kit: shell,
   `components/ui/**`, `components/charts/**`, `lib/{api,errors,format,media,return-to,theme,schema}`,
   `i18n/{index,format}`). Se conservan rutas y pantallas, el cliente de API del dominio (que ahora
   importa `request`/`getJson` del kit), `server.ts`, `index.html`, `main.tsx` y las claves es-CO del
   dominio.
3. Reescribir imports relativos a `from "@anexa/ui"` (gráficas: `"@anexa/ui/charts"`). Si la app usaba
   un símbolo que `src/index.ts` del kit no exporta, se agrega al kit y se publica un tag nuevo; nunca
   se copia de vuelta a la app.
4. Ajustar a la API actual del kit: `StatusBar` recibe `health: { liveness, readiness }`; el catálogo
   de la app pasa por `extendMessages`; los códigos de error por `registerErrorMessages`.
5. `bun run typecheck && bun test && bun run build` y los e2e de la app.

## 5. Trabajo diario entre repositorios

- **Probar un cambio del kit sin publicar**: `bun link` en el kit y `bun link @anexa/ui` en la app
  (alternativa: `"@anexa/ui": "file:../anexa-ui"` temporal). Antes del PR se vuelve al tag: ese estado
  **nunca** se commitea.
- **Publicar**: subir `version` en `package.json` al número del tag, commit,
  `git tag vX.Y.Z && git push origin master --tags`.
- **Actualizar una app**: `bun add github:anexa-digital/anexa-ui#vX.Y.Z` (reescribe `bun.lock`); CI y
  Docker instalan con `--frozen-lockfile`.
- **Compatibilidad**: mientras el kit esté en `0.x`, un cambio que rompe la API de un componente sube
  el minor y se anota en el mensaje del tag.
- **Contenido**: el repositorio es público. Nada de secretos, hosts, nombres de clientes ni reglas de
  negocio; todo lo específico de una app vive en la app.
