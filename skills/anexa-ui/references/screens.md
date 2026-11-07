# Screens: how each kind is composed

Three templates cover a business app. Compose with the kit, never with a `Panel` around a grid.

## A list

```
PageHeader  title · subtitle ............................ [Importar] [Nueva cotización N]
┌ grid card ─────────────────────────────────────────────┐ ┌ Drawer 380px ──────────┐
│ [⌕ Buscar /] [estado: Aprobada ×] [+ Filtro]  Vistas Columnas Exportar Compacta │ │ COT-1040 · Cliente  rev 3 ×│
│ CÓDIGO ↕  CLIENTE  PRODUCTO  CANTIDAD  PRECIO  ESTADO  ⋯ │ │ fields…                 │
│ COT-1041  …                                          ⋯ │ │                         │
│ 1–50 de 320  Anterior Siguiente      ↑↓ fila · ⏎ abrir · Espacio · F2 │ │ Guardado hace 2 min  Cancelar Esc  Guardar Ctrl⏎ │
└────────────────────────────────────────────────────────┘ └─────────────────────────┘
```

```tsx
export function QuotationsPage({ search }: { search: ListSearch & { edit?: string; new?: boolean } }) {
  const navigate = useNavigate();
  rememberListSearch("/quotations", search);                       // «back» from a detail lands here
  useShortcut("n", () => navigate({ search: { ...search, new: true } }), { description: t("shortcuts.listNew"), group: "list" });
  return (
    <div className="flex h-full flex-col gap-3">
      <PageHeader title={t("quotations.title")} subtitle={summary} actions={<ActionBar><Link to="/quotations" search={{ ...search, new: true }} className={`${primaryClass} flex items-center gap-1.5`}>{t("quotations.new")}<KeyHint keys="n" className="kbd-on-accent" /></Link></ActionBar>} />
      <div className="flex min-h-0 flex-1 gap-[var(--gap)]">
        <ServerGrid grid="quotations" rows={rows} total={total} columns={COLUMNS} getRowId={(r) => r.id} fill createKeys
          loading={list.isPending} error={list.error} onRetry={() => list.refetch()}
          empty={{ title: t("quotations.empty"), body: t("quotations.emptyBody"), action: <NewButton /> }}
          onOpen={(row) => navigate({ to: "/quotations/$id", params: { id: row.id } })}
          rowActions={(row) => rowActionItems({ onOpen: …, onEdit: () => navigate({ search: { ...search, edit: row.id } }), onDelete: () => remove(row) })}
          toolbar={<><SearchBox value={q} onChange={setQ} /><FilterBar … /></>}
          sorting={…} onSortingChange={…} sortable={…} page={…} pageSize={…} onPage={…} onPageSize={…} exportName="cotizaciones" exportAll={…} selectable actions={bulk} />
        <Drawer id="quotation" open={Boolean(search.edit || search.new)} title={…} onClose={() => navigate({ search: { ...search, edit: undefined, new: undefined } })}>
          <QuotationForm … />
        </Drawer>
      </div>
    </div>
  );
}
```

- The page root is `flex h-full flex-col`; the grid `fill`s. The drawer is the last flex child of a row.
- The toolbar holds search and filters (left) and the kit's tools (right); the header holds the actions.
- The code column renders `RecordLink`; `onOpen` goes to the detail route.
- Loading shows skeleton rows, an error the message and «Reintentar», an empty list what to do.

## A detail

```
← Cotizaciones   COT-1041   Alimentos La Cosecha · Caja RSC 400×300×250 · rev 3   [Documento] [Enviar a aprobación E] [⋯]
┌ summary (KpiCard / Stat) ─┐ ┌ sections, each a Panel with its own fields ─┐
```

- `useBreadcrumb({ label: code, siblings })`, `PageHeader back title={code} subtitle={<RecordLink … />…} actions={<ActionBar danger={…}>…</ActionBar>}`.
- The record's own data is `Facts` inside a `Panel` (caption left, value right, «—» when empty), never a hand-made
  row of spans.
- Every related record in the subtitle or a fact row is a `RecordLink`.
- Tabs live in the URL (`search.tab`), never in component state.
- State actions confirm with `useConfirm` and answer with a toast that repeats the verb.

## An embedded page (a guide, a printable document)

A page of the same origin shown inside the app goes in `ThemedFrame` with a `map` from its own CSS variables to the
kit's tokens, so it follows the skin and mode live. Write such pages tokenized: every color and family a variable on
`:root` (including the ink on the accent, `--on-accent`), a dark block under `[data-theme="dark"]`, no hex in rules,
no «→» glued to link text. Its CSP must allow `font-src 'self'` for the kit's fonts.

## Inicio (the home)

The first thing is what waits for this person today (requests assigned, quotations to approve, deadlines), each
row with its action; the KPI cards of the design come after. No generic row of numbers first.

## Keys

| Key | Where | Does |
| --- | --- | --- |
| `Ctrl/⌘ K` | everywhere (global) | palette: screens, commands, records |
| `?` | everywhere (global) | the shortcuts of this screen |
| `g <letter>` | menu | go to a screen (`NavItem.keys`, registered by the app) |
| `/` | a list | focus the search |
| `n` | a list | new record (the screen registers it) |
| `↑ ↓ Home End PgUp PgDn` | a focused row | move, page |
| `⏎` | a focused row | open |
| `Espacio` | a focused row | mark (selection) |
| `F2`, `D`, `Supr` | a focused row | the row actions that declare those keys |
| `Alt ← →` | a column header | move the column |
| `Ctrl/⌘ ⏎`, `Esc` | a form | save, cancel (and close the drawer) |

A dialog or a drawer suspends the page's keys while open; `Ctrl K` and `?` keep working. Register with
`useShortcut(keys, handler, { description, group })`; `description` and `group` feed the `?` dialog.
