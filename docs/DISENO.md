# Diseño: los artboards, los skins y lo que se decidió

Referencia: canvas «Anexa UI v0.4 — cinco direcciones» (https://claude.ai/artifact/D9nVRpzgNvJKLMdtz4qMgu). Una
sola pantalla (Cotizaciones: barra de título, 4 KPI, grilla-tarjeta, panel lateral de edición de 380 px, gráfica,
diálogo de confirmación, toast, barra de estado) dibujada en cinco skins, más Solicitudes en teléfono (bandeja con
pestañas segmentadas y hoja inferior de aprobación). El método para construir con esto está en
`skills/anexa-ui/SKILL.md`; aquí viven los valores y las decisiones.

## Plan de diseño por skin (revisado contra el brief)

| Skin | Colores base | Tipografía | Radio / fila | Chrome | Lo memorable (único) | Se mantiene quieto |
| --- | --- | --- | --- | --- | --- | --- |
| **Cockpit** (default, oscuro) | paper #0D0F12 · surface #14171C · ink #E6E9EF · muted #8B93A1 · accent #C6F432 · accent-2 #67D4FF | Inter 12 px; cifras y códigos en JetBrains Mono (`zero` tachado); etiquetas versalitas 10.5 px .08em | 4–8 px (kbd 3, control 5, tarjeta 6, diálogo 8) / 24 px | rail de 56 px con monograma lima, migas arriba, paleta al centro (360 px) | el acento lima y los LED que brillan (`--led-glow`) en KPI, badges y semáforo | bordes de 1 px, sin sombras salvo overlays, zebra sutil |
| **Ledger** (claro) | paper #F7F4EE · ink #1B1A17 · muted #6B655B · accent #1F3A93 · series-2 #C2410C | Fraunces en títulos y cifras grandes (26 px), Inter 13 px con `tnum`; etiquetas sentence case 11 px | 3 px / 26 px | menú superior con grupos, barra de comandos centrada, migas **bajo el título** | el display serif sobre papel cálido y la marca `[Omnipax]` | badges rectos, chips píldora, sin LED |
| **Terminal** (oscuro) | paper #0B0C0B · ink #D7E0D2 · accent #F5B341 · ok #5FE38A | IBM Plex Mono 12.5 px en todo; títulos `┌─ ─┐` | 0 / 24 px, bordes de caja | barra de texto con grupos numerados, cada acción muestra su tecla `[F2]` | las teclas entre corchetes y el cursor de bloque | sin zebra, la fila activa se rellena de ámbar |
| **Studio** (claro) | paper #F3F5F6 · ink #14222B · accent #0E7490 · accent-2 #E85D3A | Manrope 13 px/500, títulos 700–800 con tracking -.03em | 9–14 px, sombras leves / 28 px | barra lateral de 220 px con secciones y conteos, tarjeta de usuario abajo | las píldoras coral (conteos, deltas, badges) | sin búsqueda en la barra de la grilla (el artboard no la dibuja: la mantenemos, decisión propia) |
| **Blueprint** (claro) | paper #EEF3F8 · ink #0F2238 · accent #0B63C7 · gridln rgb(11 99 199/.08) | Space Grotesk en títulos, IBM Plex Sans 12.5 px; etiquetas versalitas .12em | 2 px, divisores punteados / 26 px | barra CAD bajo la cabecera (vistas Lista/Tablero/Calendario, acciones con tecla) | el sello `OMNIPAX` con marcas de esquina y la rejilla de 24 px | badges-sello con borde, KPI con etiqueta `K-01` |

Lo que el artboard **no** fija y decidimos (anotado para que no parezca default): las flechas de orden siempre
visibles (el artboard no las dibuja; la productividad las pide); el menú de encabezado y el arrastre de columnas;
la columna «⋯» de acciones por fila; el estado vacío con acción; el skeleton de carga; «Deshacer» en el toast para
borrados baratos; el formato de fecha `YYYY-MM-DD` por defecto; el enlace de registro en acento 2 mono (viene del
`.code` del artboard).

## Detalles del artboard que el kit replica (dónde)

| Detalle | Valor del artboard | En el kit |
| --- | --- | --- |
| Barra de título | h1 18/600 Inter (Ledger 26 Fraunces), subtítulo muted al lado, acciones a la derecha con `kbd` dentro del primario | `PageHeader`, `KeyHint className="kbd-on-accent"` |
| kbd en botón primario | `color: on-accent`, borde `rgb(0 0 0/.35)` o `rgb(255 255 255/.45)`, fondo transparente | `.kbd-on-accent .kbd` (color-mix de `--on-accent`) |
| KPI | tarjeta surface, etiqueta versalita 10.5, valor 26 mono, delta 11, LED 8 px con glow arriba a la derecha | `KpiCard tone` → `.led` |
| Grilla-tarjeta | toolbar (búsqueda 240 px con lupa y `/`, chips «campo **valor**», «+ Filtro», Vistas Columnas Exportar Compacta), th 10.5 versalita sobre `--head`, filas 24–28 px, zebra `--row-alt`, fila activa `--row-active` + barra interior 2 px, números a la derecha en mono, código en acento 2, paginador «1–8 de 128 · ↑ ↓ fila · ⏎ abrir · Espacio seleccionar» | `ServerGrid`/`DataGrid`, `SearchBox`, `FilterBar`, `DensityButton`, `GridTable`, `KeysHint` |
| Badges | Cockpit mayúsculas 10.5/600 radio 4; Ledger sentence case; Studio píldora; Blueprint sello; Terminal `[texto]` | `Badge` (la caja sigue `--radius-sm`; el texto lo da la app en sentence case: el skin no puede cambiar el caso del contenido sin romper tests, decisión) |
| Semáforo | punto 8 px + palabra; brilla en Cockpit | `Light` |
| Panel lateral | 380 px, cabecera «COT-1040 · Cliente» + «rev 3», campos con etiqueta arriba, dos columnas, unidad dentro del campo, error bajo el campo, pie «Guardado hace 2 min · Cancelar Esc · Guardar Ctrl ⏎» | `Drawer`, `DrawerActions`, `SavedAt`, `NumberField unit` |
| Diálogo | 380 px, raised, borde line-strong, radio 8, pie Cancelar [Esc] · Enviar [⏎] | `Dialog size="sm"`, `useConfirm` |
| Toast | 320 px abajo a la derecha, título con punto ok, botón de acción | `ToastProvider` (ya) |
| Barra de estado | 22 px mono: punto de salud, «api ok · db ok», pill de entorno, versión, «atajos ?», TENANT | `StatusBar` |
| Rail | 56 px, logo 32 px, ítems 40 px, punto de pendientes con glow, tema y cuenta abajo | `NavMenu` (el punto es `.led`: brilla en Cockpit) |
| Teléfono | top bar 44 px, pestañas segmentadas con conteos, filas como tarjetas, hoja inferior con tiles clave-valor y botones de 48 px, tab bar inferior de 64 px | `GridCards`, `BottomTabs`, `Drawer` a pantalla completa (la hoja inferior queda pendiente) |

## Medida (auditoría `skills/anexa-ui/references/audit.md`)

| Métrica (Omnipax `apps/web/src`) | 2026-11-07 inicio | cierre |
| --- | --- | --- |
| hex sueltos fuera de i18n | 12 (escena del login) | 12 (la misma escena, decorativa) |
| tamaños arbitrarios | 0 | 0 |
| `window.confirm` | 10 | 0 |
| `<table>`/`<Table>` fuera de las grillas | 45 | 7 (documento imprimible, matrices editables de reglas, cambio protegido, legacy, el `Table` exportado por `pricing/ui`) |
| botones con estilo a mano | 49 | 32 (pestañas, chips y controles del visor 3D y del asistente de simulación; pendientes) |
| inputs de fecha nativos | 26 | 1 |
| `toISOString().slice(0, 10)` (hoy en UTC) | 5 | 1 |
| `toLocaleString("es-CO")` | 53 | 3 (portal del cliente) |
| `title=` como tooltip | 164 | 160 (pendiente: pasar a `Tooltip` pantalla a pantalla) |
| verbos genéricos bajo claves de dominio | 28 | 28 claves, mismos valores que `ui.*` (174 textos revisados, ver la auditoría de textos de Omnipax) |
| estilos de enlace distintos | 8 | 1 (`RecordLink`) en listas y detalles; quedan enlaces de texto en ayudas |

## Intentos (lo probado y descartado)

- 2026-11-07 · Registro de atajos propio con scopes: descartado por TanStack Hotkeys (beta), que trae scopes
  exclusivos, registro legible y rebinding; el kit lo envuelve para conservar su gramática (`mod+k`, `g q`).
- 2026-11-07 · Lookup como `<select>` con buscador al lado (EntryPicker de Omnipax): descartado; el combobox con
  búsqueda en servidor, «Buscar más…» y «Crear…» (patrón Odoo mejorado) reemplaza a los selects de llave foránea.
- 2026-11-07 · `formatDate` fijo `dd/mm/yyyy`: descartado por preferencias por persona con default de empresa.
- 2026-11-07 · Mayúsculas en el texto de los badges (Cockpit): descartado; el caso del contenido rompe las
  búsquedas por texto de los e2e y la lectura en voz; el skin solo cambia etiquetas (`.label`).
