# Cambios

## v0.6.0 — 2026-11-07

La composición de las pantallas, como en los artboards del diseño:

- **`PageHeader`**: la barra de título de una pantalla (nombre en la fuente de display, contexto al lado, acciones a la
  derecha y una segunda fila para pestañas o filtros).
- **Migas en la cabecera** (`Breadcrumbs`, exportado): con el menú al lado, la cabecera muestra «Sección / Pantalla» a
  la izquierda, calculado desde `sections` y la ruta.
- **Monograma**: el rail y la barra lateral abren con la marca (`mark` de `AppShell`, por defecto la inicial de `name`)
  en una caja del acento; ancha, al lado va el nombre. `NavMenu` recibe `brand`.
- **La grilla es una tarjeta**: `ServerGrid` y `DataGrid` dibujan una sola superficie con la barra de herramientas
  arriba, las filas y el paginador abajo (con la pista de teclas «↑ ↓ fila · ⏎ abrir» en pantallas anchas); una lista
  vacía muestra un `EmptyState` dentro. `GridTable` acepta `bare`; `Pager` acepta `hint`.

## v0.5.2 — 2026-11-07

- El menú de tema ya no cambia el skin al pasar el puntero (ni al enfocar con el teclado): la pantalla saltaba de skin
  antes de hacer clic. La muestra de colores de cada opción es la vista previa; el skin cambia solo al elegirlo.
  `previewSkin` sigue exportado para el playground o una galería.

## v0.5.1 — 2026-11-07

- `package.json` volvía a ser JSON válido: la v0.5.0 terminaba con un `\n` literal tras la llave. Bun lo instalaba igual,
  pero `tsc` no leía el `exports` y la app no resolvía `@anexa/ui` al compilar la imagen. Sin otros cambios.

## v0.5.0 — 2026-11-07

Formularios completos y registros sobre TanStack Store. Nuevos peers exactos: `@tanstack/store` y
`@tanstack/react-store` 0.11.2 (`bun add` en la app).

- **Campos.** `TextField` acepta `type` (`text`, `email`, `url`, `password`, `date`, `month`, `search`, `tel`),
  `placeholder`, `autoComplete`, `maxLength`, `inputMode`, `transform` (p. ej. mayúsculas) y `title`; `NumberField`
  acepta `unit`, `min`, `max`, `step`, `placeholder` y `decimal` (texto con coma o punto, sin flechas); `TextareaField`
  acepta `rows`, `placeholder`, `maxLength`; `SelectField` recibe `options: SelectOption[]` y `empty` (la opción
  vacía). Nuevos `RadioField` y `CheckboxesField` (valor `string[]`). Todos aceptan `help`, `required`, `disabled`,
  `wide` y `className`.
- **Validación.** `required` (exportado) para `validators={{ onSubmit: required }}`: vacío, solo espacios o arreglo
  vacío → «Obligatorio».
- **`Form`** valida primero lo nativo (`required`, `min`, `type="email"`… de controles propios de la app que sigan dentro) con
  `reportValidity` y luego envía por TanStack; los campos del kit ponen `aria-required`, no el atributo, para que sus
  mensajes no compitan con las burbujas del navegador. El asterisco de obligatorio se dibuja con CSS
  (`.label[data-required]::after`): el texto de la etiqueta sigue siendo solo el nombre del campo. Ctrl/⌘ ⏎ pasa por `requestSubmit`, el mismo camino. Recibe `id` y `title`; `SubmitButton` recibe `pendingLabel`, `keys` y `form` (el `id` de un `Form`
  que vive en otra parte, para el pie de un diálogo). `FormError` muestra el error del servidor que `submitError`
  no pudo asignar a un campo.
- **Atajos y paleta.** El registro de atajos y el de comandos (y el estado abierto de la paleta) pasan a
  `@tanstack/store`, leídos con `useStore`: se acaban los suscriptores a mano y los bucles de render que producían.

## v0.4.1 — 2026-11-07

- Los grupos del rail ya no llevan `aria-label`: su nombre va como texto solo para lectores de pantalla (y `title`),
  así una consulta por etiqueta («Producto») encuentra solo el campo del formulario que se llama así y no el menú.
- El botón de búsqueda del teléfono toma su nombre del catálogo (`ui.search`).

## v0.4.0 — 2026-11-07

Seis skins conmutables en vivo, primitivas de escritorio y formularios. Rompe la API de 0.3 en estos puntos:

- **Paletas → skins.** `PALETTES`, `applyPalette`, `currentPalette`, `DEFAULT_PALETTE` y las claves `theme.palette.*`
  desaparecen. En su lugar: `SKINS` (`cockpit`, `ledger`, `terminal`, `studio`, `blueprint`, `classic`),
  `applySkin`, `currentSkin`, `DEFAULT_SKIN` (cockpit), `previewSkin`, más `DENSITIES`/`applyDensity` y
  `applyShowKeys`. `anexa_palette` guardado en el navegador se migra a `anexa_skin = classic` (`migrateLegacyPalette`,
  que `applyStoredTheme` y el `index.html` de referencia ya llaman). El modo por defecto es el nativo del skin
  (`SKIN_MODE`), no «claro».
- **`index.html`.** Debe aplicar `data-skin`, `data-theme`, `data-density` y `data-keys` antes del primer pintado:
  snippet en `docs/ADOPCION.md`.
- **`AppShell`.** `nav` es opcional: con `sections` (`NavSection[]`) el shell dibuja el menú, alimenta la paleta de
  comandos y las pestañas del teléfono. Nuevos `layout` (`top` | `rail` | `sidebar`, por defecto el del skin) y
  `commands`. Monta `ShortcutProvider` y `CommandPalette`.
- **`NavSection`.** `links` pasa a opcional; `items: NavItem[]` (label, to, search, icon, count, keys) es la forma
  recomendada: la necesitan el rail, la barra lateral, las pestañas y la paleta.
- **Alturas y radios por token.** `h-7`, `rounded`, etc. de los controles pasaron a `var(--control-h)`,
  `var(--radius-*)`; `controls.ts` incluye las nuevas clases. Las filas de las grillas leen `--row-h` / `--row-h-lg`.
- **Fuentes autoalojadas** (`src/styles/fonts/*.woff2`): `installFonts()` las registra; `main.tsx` lo llama (el
  `AppShell` también). `@anexa/ui/styles.css` trae tokens y skins, no fuentes.
- **Peer nuevo:** `@tanstack/react-form` 1.33.5.

Nuevo:

- Skins: `src/styles/base.css` (tokens estructurales, densidad, movimiento) + `src/styles/skins/*.css`; guardia de
  contraste `src/theme.test.ts` sobre 6 skins × 2 modos.
- Atajos: `ShortcutProvider`, `useShortcut` (combos y acordes `g q`), `Kbd`, `KeyHint`, diálogo `?`.
- Paleta de comandos: `CommandPalette` (Ctrl/⌘ K), `registerCommands`, `useCommands`, `CommandButton`,
  `openCommandPalette`, búsqueda difusa (`fuzzyFilter`).
- Formularios: `useAppForm` con `TextField`, `NumberField`, `SelectField`, `CheckboxField`, `TextareaField`,
  `ComboField`, `PercentField`, `SchemaField`; `Form` (Ctrl/⌘ ⏎ envía, Esc cancela), `SubmitButton`, `CancelButton`,
  `FormError`, `FormActions`; `submitError` reparte el `ApiError` por campo.
- Layout: `Toolbar`/`ToolbarDivider` (las grillas lo usan), `SplitPane` redimensionable con teclado, `ThemeMenu`
  con vista previa de los skins, iconos genéricos (`home`, `search`, `settings`, …).
- `useHtmlAttribute`, `useTokenPx` para leer el tema desde React; `appDefaults` para el default por empresa o build.
- Playground: `bun run playground` (http://localhost:5190).

## v0.3.0

Primera versión publicada: los componentes de Omnipax tal cual, con `extendMessages`, `registerErrorMessages` y
`StatusBar` con `health`.
