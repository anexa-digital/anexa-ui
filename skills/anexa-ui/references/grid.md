# Grids

`ServerGrid` when the server pages and sorts (`GET /v1/lists/{name}` describes filters), `DataGrid` when the rows are
already in memory. Both are one card: toolbar, rows, pager.

## Columns

```ts
const COLUMNS: GridColumn<Quotation>[] = [
  { id: "code", header: t("quotations.code"), accessorKey: "code", size: 110, meta: { code: true }, cell: (c) => <RecordLink to="/quotations/$id" params={{ id: c.row.original.id }} code={c.getValue<string>()} /> },
  { id: "customer", header: t("quotations.customer"), accessorKey: "customer_name", size: 200 },
  { id: "quantity", header: t("quotations.quantity"), accessorKey: "quantity", size: 100, meta: { align: "right" }, cell: (c) => formatNumber(c.getValue<number>()) },
  { id: "price", header: t("quotations.price"), accessorKey: "price", size: 110, meta: { align: "right", text: (r) => r.price }, cell: (c) => formatMoney(c.getValue<string>(), c.row.original.currency) },
  { id: "status", header: t("quotations.status"), accessorKey: "status", size: 130, cell: (c) => <Badge dot tone={STATUS_TONE[c.getValue<string>()]}>{label}</Badge> },
  { id: "light", header: t("quotations.light"), accessorKey: "light", size: 110, cell: (c) => <Light tone={…}>{word}</Light> },
  { id: "created", header: t("quotations.date"), accessorKey: "created_at", size: 110, cell: (c) => formatDate(c.getValue<string>()) },
];
```

- `id` is required (preferences and views refer to it); `header` is a string (the columns panel shows it).
- `meta.code` draws the figures' face in the second accent; `meta.align: "right"` right-aligns tabular figures;
  `meta.hidden` hides until chosen; `meta.text` gives the export and the quick search a plain value.
- Columns are module constants (texts are evaluated when the module loads, after `register.ts`).

## What the person can do, without code in the screen

Sort by click (Shift adds a second), see the arrows always; drag a header to move a column (Alt ← → too);
resize (double-click fits); the header menu (sort, pin, fit, hide, reset); the columns panel (show, order, pin,
density); saved views; density «Compacta / Cómoda»; export Excel or CSV of the visible columns; the quick search
with `/`; on a phone, rows become cards.

## What the screen passes

| Prop | Why |
| --- | --- |
| `onOpen` | ⏎ and double click open the record (navigate) |
| `rowActions={(row) => rowActionItems({ onOpen, onEdit, onDuplicate, onDelete, extra })}` | the ⋯ column; items with `keys` run from the focused row |
| `fill` | the card takes the page's height; the page root is `flex h-full flex-col` |
| `empty={{ title, body, action }}` | the empty state invites to act |
| `loading`, `error`, `onRetry` | skeleton rows, or the message with «Reintentar» |
| `createKeys` | the pager hint shows «N nuevo» (the screen registers `n`) |
| `selectable`, `actions` (BulkAction[]) | selection bar with bulk actions, each confirmed and reported |
| `grouping` | sections per group value, lazily loaded |
| `toolbar` | search and filters at the left: `SearchBox`, `FilterBar`, `GroupBar`, selects with `aria-label` |
| `exportName`, `exportAll` | the export menu |

Preferences (columns, order, widths, pinning, density, views) are kept per grid name; an app that stores them
per person on its server calls `configureGridStorage({ get, set })` once (the kit reads synchronously from the
adapter's cache). The URL keeps `page`, `size`, `sort`, `filters`, `group` (`ListSearch`, `validateListSearch`,
`nextListSearch`).

## Deleting from a grid

Cheap and reversible: remove the row at once and show a toast with «Deshacer» (the mutation is sent when the toast
closes without undo, or at once with a restore endpoint). Irreversible or with effects: `useConfirm` with the
verb, and a reason when the business wants one. Never `window.confirm`.
