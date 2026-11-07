# Navigation: lookups, links, breadcrumbs, back

## Looking up a related record

`RecordPicker` (or `RecordField` inside a form) is the kit's answer to Odoo's many2one, improved:

- type → the server searches (debounced); «Recientes» when the box is empty; `CODE · Nombre` with a hint;
- ↑ ↓ ⏎ Esc; Backspace on a chosen value clears it; the chevron opens;
- «Buscar más…» opens a dialog with a `DataGrid` of the results (sortable, with the columns the screen gives), ⏎ picks;
- «Crear «texto»…» calls `onCreate(text)`: the screen opens its own drawer or dialog and resolves with the new record;
- once chosen, the chip shows the code and a link to the record (`recordLink`);
- `allowFreeText`/`onFreeText` for a value that may not be a record yet (a prospect).

The API side: a search endpoint `?q=` returning `{ id, code, label, hint }` (map in the screen), and a way to read
one by id (`resolve`). Keep `<select>` only for a dozen fixed options (currency, term).

## Links between records

Wherever a record is named, it links: `RecordLink to params code label?`. The code column of every grid, the
subtitle of a detail (customer, product, request, cost model), fact rows, chips. One look (`.code` + underline on
hover), so people learn where to click, and real `<a>` so «open in a new tab» works.

## Breadcrumbs

The shell draws «Sección / Pantalla» from the menu; a detail adds its tramo:

```tsx
useBreadcrumb({ label: quotation.code, siblings: recent.map((q) => ({ label: q.code, to: "/quotations/$id", params: { id: q.id } })) });
```

The last tramo copies its link (hover shows the button) and, with `siblings`, opens a menu of neighbours.

## Back to the list, as it was

The list calls `rememberListSearch("/quotations", search)`; the detail's `PageHeader back` builds its link from
the trail (the list tramo) and the detail route reads `listReturnSearch("/quotations")` for the `search` when it
needs it. Never `search={{}}` by hand on a parent link.

## Routes

Flat under the shell: `/x`, `/x/$id`, sub-pages as `/x/$id/…`. Tabs in `search.tab`. A drawer's record in
`search.edit` / `search.new`. Old URLs that tests or people use keep a redirect.
