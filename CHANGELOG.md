# Cambios

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
