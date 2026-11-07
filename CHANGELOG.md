# Cambios

## v0.7.2 — 2026-11-07

- **`ThemedFrame`**: un `<iframe>` del mismo origen que sigue el skin y el modo de la app, en vivo. La página incrustada
  (una guía, un documento) solo tiene que estar tokenizada (colores y familias como variables en `:root`); `map` dice
  qué token del kit toma cada variable (`{"--bg": "--paper", "--fg": "--ink", "--display": "--font-display"}`), el
  marco le pasa `data-theme`/`data-skin`/`data-density` y las fuentes autoalojadas del kit. Sola, la página conserva su
  aspecto. Exporta también `themeCss`, `fontsCss` y `subscribeTheme`. Playground: página «Marco».

## v0.7.1 — 2026-11-07

- **El panel lateral cabe entero.** La tarjeta de `ServerGrid`/`DataGrid` encoge al lado de un `Drawer` (`min-w-0`) y sus
  filas se desplazan dentro; antes una tabla ancha empujaba el panel fuera de la pantalla y la página se corría de lado.
- **Los menús del rail se ven.** Con el rail colapsado, el menú de un grupo flota en una capa fija junto a su botón; la
  barra lateral desplazable lo recortaba y quedaba detrás de la página.

## v0.7.0 — 2026-11-07

Lo que faltaba para que una app luzca y se use como los artboards del diseño, y el método para repetirlo en
cualquier repo. Peer nuevo exacto: `@tanstack/react-hotkeys` 0.20.0 (`bun add` en la app). Lo que cambia para una app:

- **Atajos sobre TanStack Hotkeys.** `useShortcut`, `Kbd`, `KeyHint`, `useShortcutsList` siguen igual por fuera;
  por dentro registran en `@tanstack/react-hotkeys`. Novedades: un `Dialog` o un `Drawer` abierto es un scope
  exclusivo (las teclas de la página se suspenden; `Ctrl K` y `?` siguen porque son `global: true`), `target` para
  teclas que solo valen con el foco dentro de un elemento (el `Form` ya lo usa: Ctrl/⌘ ⏎ y Esc salen del
  `onKeyDown`), `toHotkey("mod+k")` traduce el texto del kit a la gramática de TanStack. `APP_SCOPE` exportado.
- **Grilla profesional.** Flechas de orden siempre visibles (iconos, acento al ordenar); arrastrar el encabezado
  reordena columnas (eventos nativos → `setColumnOrder`; Alt ← → con el teclado); menú por columna (ordenar, fijar,
  ajustar ancho, ocultar, restablecer); doble clic en el separador ajusta al contenido; `rowActions` dibuja la
  columna «⋯» fija a la derecha y sus teclas (F2, D, Supr) actúan sobre la fila enfocada; Espacio marca la fila,
  PgUp/PgDn cambian de página; `loading` (filas esqueleto), `error` + `onRetry`, `empty` acepta `{title, body,
  action}`; botón «Compacta/Cómoda» en la barra; `SearchBox` (lupa + «/»); `createKeys` añade «N nuevo» a la pista;
  `meta.code` pinta el código en mono y acento 2; `configureGridStorage` para guardar la disposición en el servidor
  por persona; `moveColumn` exportado. Las fichas de filtro leen «campo **valor**».
- **Overlays.** `Menu`/`MenuList`/`useMenu` (roving focus, Esc, items con icono, tecla, peligro, marcado);
  `Tooltip`; `ConfirmProvider` (lo monta `AppShell`) + `useConfirm()` → promesa con `confirmed` y `reason`;
  `Drawer` (panel lateral de 380 px redimensionable, Esc, scope de teclas, pantalla completa en el teléfono) con
  `DrawerActions` y `SavedAt` («Guardado hace 2 min»); `Dialog` recibe `size` (sm/md/lg/xl), `initialFocus` y
  `description`.
- **Formularios.** `DateField` y `MonthField` (valor `YYYY-MM-DD`; se escribe en el formato de la persona, el ISO
  siempre vale, calendario con teclado y «Hoy», nativo en el teléfono); `RecordField`/`RecordPicker` (lookup de
  registros con búsqueda en el servidor, «Buscar más…» con grilla, «Crear «texto»…», enlace al registro elegido,
  texto libre opcional); `useDirtyGuard(form, onClose)`; `FIELD_COMPONENTS` exportado con los campos nuevos.
- **Fechas y locale.** `lib/preferences.ts` (`setPreferences`, `usePreferences`, `DATE_FORMATS`): locale, formato
  de fecha, zona horaria y moneda de la persona (la app las carga de su API). `formatDate` sigue las preferencias
  (por defecto `YYYY-MM-DD`: antes `dd/mm/yyyy` fijo), y llegan `formatDateTime` en la zona, `formatDateShort`,
  `formatTime`, `formatRelative`, `formatNumber`, `formatMoney`, `formatPercent`, `todayIso()` (el día de la
  empresa, nunca UTC), `civilDate`, `addDays`, `parseDateInput`. `formatDecimal` respeta el locale.
- **Navegación.** `useBreadcrumb({label, siblings})` añade el registro a las migas (el último tramo copia su
  enlace y despliega vecinos); `useBreadcrumbTrail`; `PageHeader back` dibuja «← Lista» desde las migas;
  `RecordLink` (código en `.code` + nombre); `rememberListSearch`/`listReturnSearch` para volver a la lista con sus
  filtros.
- **Botoneras.** `ActionBar` (peligro a la izquierda, primario último), `rowActionItems({onOpen, onEdit,
  onDuplicate, onDelete, extra})` con los verbos, iconos y teclas estándar, `TenantMenu` para la empresa en uso.
- **Detalles del artboard.** Iconos nuevos (flechas, plus, edit, trash, copy, filter, download, pin, drag, user,
  logout, info, warning…: la grilla ya no usa glifos Unicode); `Badge dot` y `Light` (punto que brilla donde el
  skin lo pide: `--led-glow`, Cockpit); LED en `KpiCard`; `kbd-on-accent` para teclas dentro de un botón primario;
  clases `.code`, `.record-link`, `.led`, `.prose-narrow`; movimiento solo como respuesta (`dialog-in`,
  `drawer-in`, `tooltip-in`, `row-out`) y apagado con reduced-motion; `Chip tone` (filtro con borde, valor en
  tinte); `EmptyState` con cuerpo a 65ch y acción; `GridSkeleton`, `LoadError`.
- **Método replicable.** `skills/anexa-ui/SKILL.md` (viaja en el paquete) con sus referencias: composición de
  pantallas, grilla, formularios, navegación, fechas, teclas, escritura, auditoría, crítica con capturas,
  accesibilidad, checklist. `CLAUDE.md` del repo. `docs/DISENO.md` con los tokens y detalles de cada skin.
- Textos nuevos `ui.*`, `grid.*`, `form.saved*`, `shortcuts.list*`.
- Lo que dejó la adopción en Omnipax (e2e en verde): los menús («⋯» de fila, encabezado, exportar) flotan en una
  capa fija sobre su botón (una celda fija ya no los recorta ni las filas de abajo los tapan) y se cierran al
  desplazar; las teclas dibujadas junto a un botón (`KeyHint`, diálogo de confirmación, menús, paleta) no forman parte
  de su nombre accesible («Enviar», no «Enviar ⏎»); un `Dialog` cerrado no tiene nombre y «Buscar más…» solo existe
  abierto (una búsqueda por etiqueta de un campo no los encuentra); el botón del menú de columna se llama «Opciones
  de columna»; `formatDateTime` escribe el día en el formato de la persona y la hora en 24 h; `SearchBox` recibe
  `label` y se exporta; la × y Esc de un `Drawer` pasan por el `useDirtyGuard` del formulario que contiene
  (`useDrawerGuard`); «volver» a una lista conserva sus filtros; solo el tramo de un registro se pinta como código;
  `KpiCard` pierde el borde de color (el LED dice el tono); una tarjeta de grilla en el teléfono omite campos vacíos;
  el punto de pendientes del rail es un LED.

Cambios que una app debe mirar: `formatDate` ya no devuelve `dd/mm/yyyy` salvo que la persona (o la empresa) lo
elija; `Chip` cambia de aspecto (filtro) salvo `tone="value"`; la columna `_actions` aparece al pasar `rowActions`;
el `Form` ya no captura `onKeyDown` (las teclas llegan por el registro). `FIELD_COMPONENTS` de `fields.tsx` pasa a
llamarse `BASE_FIELD_COMPONENTS`; el completo se exporta desde el índice.

## v0.6.1 — 2026-11-07

- **Un solo scroll.** En escritorio el marco es la ventana: la cabecera, el menú y la barra de estado se quedan quietos
  y solo la página se desplaza (`main`). Antes se desplazaba el documento entero: el menú se iba y la barra de estado
  pegajosa tapaba el paginador de una grilla. En el teléfono sigue desplazándose el documento.
- **`fill` en `ServerGrid` y `DataGrid`**: la tarjeta toma la altura que la página le deja (la página es
  `flex h-full flex-col`) y las filas se desplazan dentro, con la barra de herramientas y el paginador siempre a la
  vista; reemplaza a `maxHeight="calc(100vh - 13rem)"`.

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
