---
name: anexa-ui
description: >-
  Use when building or changing any screen of an app that uses @anexa/ui (Omnipax and the other Anexa Digital
  apps): a list, a detail, a form, a dialog, a lookup, dates, shortcuts, the home page, or when auditing a UI for
  consistency, writing its texts, or reviewing screenshots against the design. It says how every screen is composed,
  where each button goes, how forms open, how records are looked up and linked, which keys exist, and how to measure
  and critique the result, so the same quality repeats in every repo.
---

# Anexa UI: how a screen is built

The kit is `@anexa/ui` (repo `anexa-digital/anexa-ui`, installed by tag with Bun). Everything generic lives in the
kit; an app holds only its domain. If a screen needs something the kit lacks, add it to the kit, publish a tag,
adopt it: never copy kit code into the app, never install shadcn, radix, base-ui or dnd-kit. **TanStack first**:
Query, Router, Table, Form, Virtual, Store and Hotkeys are the only libraries behind the kit; before adding
another, read the current TanStack docs (`https://tanstack.com/<lib>/latest/docs/...`). Bun runs everything
(install, build, test, serve); never Vite.

Read `references/process.md` before designing anything new. Then the reference that matches the work:

| Work | Read |
| --- | --- |
| A list screen, a grid, columns, actions on rows, bulk actions | `references/screens.md`, `references/grid.md` |
| Creating, editing, confirming, deleting | `references/forms.md` |
| Picking a related record (customer, product), links between records, breadcrumbs, back | `references/navigation.md` |
| Dates, numbers, money, time zones, per-person preferences | `references/dates.md` |
| Keyboard shortcuts, the palette | `references/screens.md` §Keys |
| Texts: buttons, titles, errors, empty states | `references/writing.md` |
| Measuring consistency before and after, finding stray styles | `references/audit.md` |
| Reviewing a built screen, screenshots against the design | `references/critique.md`, `references/screenshots.md` |
| Accessibility of a new component | `references/a11y.md` |
| The final pass before shipping | `references/checklist.md` |
| The six skins, tokens and what the design fixes | `docs/DISENO.md` in the kit repo |

## The ten rules

1. **Every screen opens with `PageHeader`** (title in the display face, context as `subtitle`, actions at the
   right, `back` on a detail). The shell draws the breadcrumbs; a detail adds its record with `useBreadcrumb`.
2. **A list is `ServerGrid` (server pages and sorts) or `DataGrid` (rows in memory)**, never a hand-written
   `<table>`. Columns are `GridColumn[]` constants; the code column is `meta.code` and renders a `RecordLink`;
   numbers are `meta.align: "right"`. Pass `onOpen` (⏎ opens), `rowActions` (⋯ menu with F2 / D / Supr), `fill`,
   `empty` with body and action, `loading` and `error`.
3. **«Nuevo» lives in `PageHeader actions`** as the primary button with `KeyHint keys="n"`, and the screen
   registers `useShortcut("n", …, { group: "list" })`. Editar / Duplicar / Eliminar live in `rowActions`
   (`rowActionItems`) and in the footer of the panel. State actions of a detail (Enviar, Aprobar, Publicar,
   Revocar) live in the detail's `PageHeader actions`, inside an `ActionBar`.
4. **Simple records edit in a `Drawer`** at the right of the grid (`?edit=<id>` / `?new=1` in the URL), complex
   ones (quotation, request, product) in their own route. A `Dialog` only confirms or asks for one to three
   fields. The form is `useAppForm` with the kit's fields; the footer is `FormError`, then `CancelButton` (Esc)
   and `SubmitButton` (Ctrl/⌘ ⏎, primary, last). `useDirtyGuard` before closing with changes.
5. **Confirm only what cannot be undone or reaches other people** (`useConfirm`, with `reason` when the business
   asks for one). A cheap deletion deletes and offers «Deshacer» in the toast (`ui.deletedName` + `action`).
   Never `window.confirm`.
6. **Every mutation answers**: a toast on success (`ui.savedName`, the same verb as the button), `submitError`
   on failure (the field it names, else `FormError`). Verbs name what happens: «Guardar cambios», «Enviar a
   aprobación», «Crear borrador».
7. **Related records are `RecordField` / `RecordPicker`**: search on the server, `CODE · Nombre`, «Buscar más…»
   over a grid, «Crear «texto»…» when the person may create, a link to the record once chosen. Never a plain
   `<select>` for a foreign key with more than a dozen options.
8. **Dates are `DateField`** (value `YYYY-MM-DD`, shown in the person's format), **today is `todayIso()`** (the
   company's time zone, never `new Date().toISOString()`), numbers and money go through `formatNumber`,
   `formatMoney`, `formatDate`, `formatDateTime`. The app loads `setPreferences` from its API (tenant defaults,
   then the person's).
9. **Links between records everywhere a record is named**: `RecordLink` in cells, subtitles and chips; a detail
   links to its customer, product, request, model. `back` on `PageHeader` returns to the list with its filters
   (`rememberListSearch` on the list).
10. **Texts through `t()`**, generic verbs from the kit's `ui.*` keys (never a domain namespace for «Cancelar»),
    sentence case, no filler, no «→» glued to a link, no ` · ` chains outside a subtitle.

## When to call the other skills

- `frontend-design` (if installed): a new screen, the home page, the customer portal, anything where the look is
  decided, not only composed. Follow its two passes (plan, review against the brief, build, critique).
- `design-system` in `audit` mode: at the start and the end of a UI job, with `references/audit.md`.
- `design-critique`: over the screenshots of `references/screenshots.md`.
- `ux-copy`: over the catalog of texts, with `references/writing.md`.
- `accessibility-review`: over every new component, with `references/a11y.md`.

## Publishing a kit change (Bun, in the kit repo)

```bash
bun run typecheck && bun test          # in a Bun container when the host has no Bun
# bump "version" in package.json, add the CHANGELOG entry, then
git commit -am "vX.Y.Z: …" && git tag vX.Y.Z && git push origin master --tags
# in each app
bun add github:anexa-digital/anexa-ui#vX.Y.Z
```

Smoke a local kit before tagging with `bun pm pack` in the kit and `bun add ./anexa-ui-X.Y.Z.tgz` in the app;
the commit never keeps that path. After a scripted edit of `package.json`, validate it with
`python3 -c 'import json;json.load(open("package.json"))'`.
