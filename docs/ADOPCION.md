# Adoptar `@anexa/ui` en una aplicación

Un solo kit para todas las apps de Anexa Digital: se **copia tal cual** desde este paquete y nunca
se reimplementa. Lo que falte se agrega aquí, se publica un tag y cada app sube la referencia.

## 0. Instalación y acceso

```json
"@anexa/ui": "github:anexa-digital/anexa-ui#v0.7.1"
```

Bun descarga el tarball del tag por la API de GitHub; no hace falta `git` ni llaves. El `bun.lock`
registra el tag **y** el commit, así que `bun install --frozen-lockfile` falla a propósito si el tag se
mueve. En CI conviene exportar `GITHUB_TOKEN` (en GitHub Actions, `${{ secrets.GITHUB_TOKEN }}`) en el
paso de instalación: Bun lo usa y así no se depende del límite anónimo de la API de GitHub.

## 1. Prerrequisitos de la app

- Bun 1.4.x (imagen `oven/bun:1.4.x-slim`), TypeScript estricto, React 19.3.
- TanStack en las versiones peer del `package.json` del kit (query, router, table, virtual, form), con
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
2. **`index.html`**: antes del primer pintado aplica los cuatro ejes del tema desde `localStorage`, con las mismas
   claves y defaults que `lib/theme.ts` del kit (skin `cockpit`, el modo nativo del skin, densidad `compact`, teclas
   según el skin) y migra la paleta de 0.3:
   ```html
   <script>
     (function () {
       var get = function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } };
       var skins = ["cockpit", "ledger", "terminal", "studio", "blueprint", "classic"];
       var dark = { cockpit: 1, terminal: 1 }, keys = { terminal: 1 };
       if (get("anexa_palette") !== null) { try { if (get("anexa_skin") === null) localStorage.setItem("anexa_skin", "classic"); localStorage.removeItem("anexa_palette"); } catch (e) {} }
       var skin = get("anexa_skin"); if (skins.indexOf(skin) < 0) skin = "cockpit"; // o el default de la empresa
       var mode = get("anexa_theme"); if (mode !== "dark" && mode !== "light" && mode !== "system") mode = dark[skin] ? "dark" : "light";
       var density = get("anexa_density") === "comfortable" ? "comfortable" : "compact";
       var show = get("anexa_keys"); show = show === null ? (keys[skin] ? "on" : "off") : show;
       var h = document.documentElement;
       h.setAttribute("data-skin", skin); h.setAttribute("data-theme", mode); h.setAttribute("data-density", density); h.setAttribute("data-keys", show);
     })();
   </script>
   ```
   Un default por empresa (un ajuste del tenant que la app conoce al arrancar) se fija con
   `appDefaults({ skin, density })` antes de renderizar y se repite en este script como el valor de respaldo.
3. **Fuentes**: `installFonts()` de `@anexa/ui` en `main.tsx`, antes de renderizar (el `AppShell` también lo
   hace; el login vive fuera del shell). Sin paso extra en `build.ts`: Bun emite los `woff2` importados como archivos.
4. **Textos**: un módulo `src/i18n/register.ts` con `extendMessages("es-CO", esCO)` y, si aplica,
   `registerErrorMessages({ codigo_de_la_api: "error.clave" })`, importado **primero** en `main.tsx`
   (los labels de columnas se evalúan al cargar módulos). El catálogo de la app solo trae claves de su
   dominio; las del kit no se duplican. `app.name` se sobreescribe con el nombre de la app.
5. **Shell**: `AppShell` recibe `name`, `sections` (`NavSection[]` con `items`: label, `to`, `search`, `icon`,
   `count`, `keys`), `commands` (acciones para la paleta), `right` (usuario, selector de empresa, «Cerrar sesión») y
   `footer` (`StatusBar` con `health`). El layout lo pone el skin (`cockpit` → rail, `studio` → barra lateral, el
   resto menú superior); `layout` lo fuerza. Dentro del shell funcionan `useShortcut`, `KeyHint`, `useCommands` y la
   paleta con Ctrl/⌘ K.
6. **Servidor Bun de la app** (`server.ts`): sirve el bundle, proxya `/v1/*` a la API quitando el
   prefijo, guarda los tokens de `/auth/token` en cookies HttpOnly y reintenta una vez tras un 401
   renovando el par. El navegador nunca ve un token.
7. **Docker**: etapa de build `oven/bun:1.4.x-slim` con `COPY package.json bun.lock bunfig.toml` +
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

## 5. Pasar de 0.3 a 0.4

1. `bun add github:anexa-digital/anexa-ui#v0.7.1` y los peers exactos `@tanstack/react-form` 1.33.5, `@tanstack/store` 0.11.2 y `@tanstack/react-store` 0.11.2.
2. `index.html`: el script de §2 (sustituye al de `anexa_theme`/`anexa_palette`).
3. Menú: `NavSection.links` sigue valiendo, pero conviene pasar a `items` para que el rail, las pestañas del
   teléfono y la paleta de comandos conozcan las pantallas; `AppShell` recibe `sections` (y `nav` deja de hacer falta).
4. Nada de `PALETTES`/`applyPalette` ni de `theme.palette.*`; si la app sobreescribía esas claves, bórralas.
5. Controles propios de la app con alturas fijas (`h-7`, `rounded`): pasarlos a `h-[var(--control-h)]`,
   `rounded-[var(--radius-sm)]` para que sigan a la densidad y al skin; captions con la clase `label`, cifras con `num`.
6. `bun run typecheck && bun test && bun run build` y los e2e; revisar las pantallas en los seis skins con el menú
   de tema (y en 390 px).

## 6. Trabajo diario entre repositorios

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

## De 0.5 a 0.6

- Nada rompe. Para que una app luzca como los artboards: cada pantalla abre con `<PageHeader title subtitle actions>`
  (las listas ponen sus filtros en el `toolbar` de la grilla, no al lado del título); `AppShell` acepta `mark` (por
  defecto la inicial de `name`); las grillas ya vienen encuadradas, así que no las envuelvas en un `Panel`.


## De 0.6 a 0.7

1. `bun add github:anexa-digital/anexa-ui#v0.7.1 @tanstack/react-hotkeys@0.20.0` (peer exacto nuevo).
2. **Preferencias**: al cargar la sesión, `setPreferences({ locale, dateFormat, timeZone, currency })` con los
   defaults de la empresa y lo que la persona guardó (en Omnipax, `GET /v1/auth/me/preferences`). Sin esto,
   `formatDate` muestra `YYYY-MM-DD` y «hoy» se calcula en America/Bogota.
3. **Fechas**: `TextField type="date"` e `<input type="date">` → `DateField` / `DateInput`; `type="month"` →
   `MonthField`; `new Date().toISOString().slice(0, 10)` → `todayIso()`; `toLocaleString("es-CO")` →
   `formatNumber` / `formatMoney`.
4. **Lookups**: los `<select>` de llave foránea → `RecordField` con `search` (y `resolve`, `onCreate`, `more`).
5. **Grillas**: pasa `onOpen` y `rowActions` (`rowActionItems`), `loading`/`error`, `empty` con acción, `createKeys`;
   si guardas la disposición por persona, `configureGridStorage`. `Chip` de valores elegidos: `tone="value"`.
6. **Pantallas**: «Nuevo» en `PageHeader actions` con `KeyHint`; maestros en `Drawer` (`?edit=`); `useBreadcrumb`
   en los detalles y `PageHeader back`; `useConfirm` en lugar de `window.confirm`; toast en cada mutación.
7. El método completo está en `skills/anexa-ui/SKILL.md` (viaja con el paquete:
   `node_modules/@anexa/ui/skills/anexa-ui/`); conviene enlazarlo en `.claude/skills/anexa-ui` de la app.
