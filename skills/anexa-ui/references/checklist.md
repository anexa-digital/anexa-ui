# Checklist before shipping a screen

Composition
- [ ] `PageHeader` first: title, `subtitle` with the context, actions at the right (`ActionBar`), `back` on a detail.
- [ ] A list is `ServerGrid`/`DataGrid` with `fill`, `onOpen`, `rowActions`, `empty` with an action, `loading`, `error`.
- [ ] The code column is `meta.code` + `RecordLink`; numbers `meta.align: "right"`; dates through `formatDate`.
- [ ] The toolbar has the search (`SearchBox`) and filters; the header has «Nuevo» (primary, `KeyHint n`).
- [ ] A simple record edits in a `Drawer` with `?edit=`; the form footer is FormError · savedAt · Cancelar · Guardar.
- [ ] Related records are `RecordField`; a detail links to every related record.
- [ ] `useBreadcrumb` on a detail; tabs in the URL; `rememberListSearch` on the list.

Behaviour
- [ ] `n`, `/`, `⏎`, `F2`, `Supr`, `Esc`, `Ctrl ⏎` work; the `?` dialog lists them with a description.
- [ ] Every mutation answers (toast with the same verb, or `submitError`); dangerous actions confirm or undo.
- [ ] `useDirtyGuard` before closing a changed form.
- [ ] Dates: `DateField`, `todayIso()`; money `formatMoney`; nothing hardcodes `es-CO`.

Look
- [ ] No hex, no arbitrary `rounded-[…]`/`p-[…]`, no hand-styled buttons, no `title=` as a tooltip, no `→`, no ` · ` outside a subtitle.
- [ ] Radius and heights from tokens; one link style; badges by tone with text.
- [ ] Works at 390 px; focus visible; reduced motion honoured; contrast of any new token checked.
- [ ] With real data (wide rows, long names) and the side panel open: nothing leaves the screen, the page never scrolls sideways (`main.scrollWidth == clientWidth`).
- [ ] Every overlay opened from a narrow or scrolling container (rail collapsed, grid cell, drawer) floats above the page and is fully visible.
- [ ] Screenshots read against the artboards (`critique.md`); one accessory removed.

Texts
- [ ] Verbs say what happens; same verb through the flow; errors say what and how; empty states invite.
- [ ] Generic verbs from `ui.*`; no duplicates under domain keys.
