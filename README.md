# @anexa/ui

Kit de UI compartido de las aplicaciones de Anexa Digital: **seis skins** conmutables en vivo (color, tipografía,
forma, chrome y densidad de toda la app desde un atributo de `<html>`), controles, grillas (`DataGrid` en memoria y
`ServerGrid` paginada por el servidor), formularios sobre TanStack Form, atajos de teclado y paleta de comandos,
shell con menú superior, rail o barra lateral, barra de estado, gráficas de simulación, diálogos, toasts y textos
es-CO. Código fuente TSX + CSS sin paso de build: Bun lo compila dentro de cada app.

Escritorio primero, móvil garantizado: la densidad compacta, los atajos y el layout están pensados para una mesa de
trabajo; con un dedo o una pantalla angosta cada control crece a 40 px, los menús laterales pasan a pestañas y los
diálogos a pantalla completa.

**Licencia propietaria.** El repositorio es visible para facilitar la instalación como dependencia,
pero el código solo puede usarse en aplicaciones de Anexa Digital y de sus clientes bajo contrato.
Ver [`LICENSE`](LICENSE). Las fuentes incluidas son de licencia abierta (`src/styles/fonts/LICENSES.md`).

Guía de adopción (montar una app sobre el kit, contrato de la API, trabajo diario):
[`docs/ADOPCION.md`](docs/ADOPCION.md). Cambios por versión: [`CHANGELOG.md`](CHANGELOG.md).

## Instalar

Por **tag**, con Bun:

```bash
bun add github:anexa-digital/anexa-ui#v0.6.0
```

Los peers se declaran con versión exacta en la app: `react`/`react-dom` 19.3.0,
`@tanstack/react-query` 5.104.1, `@tanstack/react-router` 1.170.42, `@tanstack/react-table` 8.21.3,
`@tanstack/react-virtual` 3.14.21, `@tanstack/react-form` 1.33.5, `@tanstack/store` y `@tanstack/react-store` 0.11.2. El `bun.lock` fija el tag y el commit.

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

```tsx
import { AppShell, StatusBar, extendMessages, registerErrorMessages, t, type NavSection } from "@anexa/ui";
extendMessages("es-CO", appMessages);       // textos del dominio de la app, antes de cualquier pantalla
registerErrorMessages({ my_code: "error.key" });

const sections: NavSection[] = [
  { id: "sales", label: t("nav.group.sales"), icon: "quotes", paths: ["/quotations"], count: 3,
    items: [{ label: t("nav.quotations"), to: "/quotations", icon: "quotes", keys: "g q", count: 3 }] },
];
<AppShell name={t("app.name")} sections={sections} commands={commands} right={<User />} footer={<StatusBar health={health} code={tenant} />} />
```

- **Skins.** `data-skin` en `<html>`: `cockpit` (default, oscuro, rail), `ledger` (editorial, claro), `terminal`
  (TUI, oscuro, teclas visibles), `studio` (suave, barra lateral), `blueprint` (plano técnico), `classic` (0.3).
  Cada persona lo elige en el menú de tema; la app fija un default por empresa o build con
  `appDefaults({ skin, density })`. Los demás ejes: `data-theme` (dark | light | system), `data-density`
  (compact | comfortable), `data-keys` (on | off). `index.html` los aplica antes del primer pintado desde
  `localStorage` (`anexa_skin`, `anexa_theme`, `anexa_density`, `anexa_keys`): snippet en ADOPCION.
- **Fuentes.** Autoalojadas y registradas por `installFonts()` (lo llama `AppShell`, y `applyStoredTheme`); una
  pantalla fuera del shell (el login) lo llama en `main.tsx`. Bun las emite como archivos con nombre con hash y el
  navegador descarga solo las del skin activo. No se importan desde CSS: el bundler de CSS de Bun las incrustaría.
- **Tokens.** Los componentes solo usan tokens (`--accent`, `--control-h`, `--radius-sm`, `--font-display`, …);
  ningún componente mira el skin. Un skin que necesita algo lo expresa como token en `src/styles/skins/<skin>.css`.
  `src/theme.test.ts` comprueba el contraste de los seis en ambos modos.
- **Shell.** `AppShell` toma el layout del skin (`SKIN_LAYOUT`) salvo que la app pase `layout`; `sections` alimenta
  el menú, las pestañas del teléfono y la paleta de comandos; `commands` añade acciones a la paleta.
- **Atajos.** `useShortcut("mod+s", save, { description, group })` registra mientras el componente vive; `?` lista
  los atajos disponibles; `KeyHint` muestra la tecla junto a un botón cuando el skin o la persona lo piden.
- **Paleta de comandos.** Ctrl/⌘ K: pantallas de `sections` y comandos (`registerCommands` / `useCommands`).
- **Composición de una pantalla.** `PageHeader` (título en la fuente de display, contexto al lado, acciones a la
  derecha, `parent` para el enlace a la pantalla madre y `children` para pestañas o filtros); con el menú al lado la
  cabecera muestra las migas (`Breadcrumbs`) y el rail abre con el monograma (`mark` de `AppShell`); `ServerGrid` y
  `DataGrid` son una tarjeta: barra de herramientas, filas y paginador con la pista de teclas.
- **Formularios.** `useAppForm` (TanStack Form) con los campos del kit: `form.AppField name="margin"
  validators={{ onSubmit: required }} children={(f) => <f.NumberField label="Margen" unit="%" required />}`
  (`TextField`, `TextareaField`, `NumberField`, `SelectField`, `RadioField`, `CheckboxesField`, `CheckboxField`,
  `ComboField`, `PercentField`, `SchemaField`); un control propio de la app entra con `form.Field` y
  `field.state.value` / `field.handleChange`. `Form` envía con Ctrl/⌘ ⏎ y respeta las validaciones nativas de los
  controles propios; `form.AppForm` envuelve `SubmitButton` (con `form` para el pie de un diálogo), `CancelButton` y
  `FormError`; `submitError(form, error)` pone la respuesta de la API en el campo que nombra o en `FormError`.
- **Textos.** Todo pasa por `t()`. El kit trae los suyos (`grid.*`, `ui.*`, `theme.*`, `system.*`, `error.*`,
  `charts.*`, `login.*`, `nav.{home,logout,menu,menuShort,account,more,sections,collapse,expand}`, `common.*`,
  `statusBar.*`, `shortcuts.*`, `palette.*`, `form.*`); la app agrega los de su dominio con `extendMessages`.
- **API.** `request`, `getJson`, `postForFile`, `postForm` y `ApiError`. Mismo origen: el servidor Bun de la app
  proxya `/v1/*` y guarda la sesión en cookie HttpOnly.
- **Grillas.** `DataGrid` (filas en memoria) y `ServerGrid` (el servidor ordena y pagina; filtros desde
  `GET /v1/lists/{name}`, exportación Excel por `POST /v1/lists/xlsx`); `/` enfoca la búsqueda, flechas y ⏎ en las filas.
- **Gráficas.** `import { ... } from "@anexa/ui/charts"`.

## Playground

```bash
bun install && bun run playground     # http://localhost:5190
```

Todos los componentes bajo el shell, con el selector de skin, modo, densidad y teclas en vivo.

## Contribuir y publicar

Lo nuevo entra aquí, no en la app. `bun run typecheck` y `bun test` deben pasar. Nada de secretos,
hosts, nombres de clientes ni datos de negocio: el kit es genérico.

```bash
# 1. subir "version" en package.json al mismo número del tag y anotar CHANGELOG.md
# 2. commit y tag
git tag vX.Y.Z && git push origin master --tags
# 3. en cada app
bun add github:anexa-digital/anexa-ui#vX.Y.Z
```

Las dependencias Git no pasan por `minimumReleaseAge` (no hay registro npm); el control de edad queda
en los peers.
