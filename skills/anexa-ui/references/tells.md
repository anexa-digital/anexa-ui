# Tells: the defaults that give a generated page away

From `frontend-design`, with what the Anexa skins decide on purpose marked. Where the artboard fixes a trait, it is a
choice and stays; where it does not, do not spend the freedom on one of these.

| Default | In the skins | In an app screen |
| --- | --- | --- |
| Warm cream + serif display + terracotta accent | Ledger uses warm paper and Fraunces on purpose; its accent is navy, never clay | Never add a warm accent of your own |
| Near-black + one acid green accent | Cockpit's graphite + lime is its one memorable thing | Do not add a second neon |
| Broadsheet hairlines, zero radius, dense columns | Terminal and Blueprint choose it | Elsewhere the radius scale is the skin's tokens |
| The SaaS card kit: everything in identical rounded cards with the same grey shadow | — | Grids are already cards; do not wrap them in `Panel`; `Panel` only groups fields or facts; shadows only on overlays |
| One border radius for everything | — | `--radius-sm` controls, `--radius-md` cards and grids, `--radius-lg` dialogs and toasts |
| Tracked ALL-CAPS eyebrow labels | Cockpit and Blueprint set `--label-case: uppercase` for captions | Never write uppercase text; the `.label` class follows the skin |
| Meta strings joined with ` · ` | The `PageHeader subtitle` («128 este mes · 7 esperan aprobación») and a record's context («COT-1040 · Alimentos») | Not in cells, helps or bodies |
| `WORD — fragment` labels with a spaced em dash | — | Never |
| `#0B0B0B` / `#111` standing in for black | The skins define `--ink` | No hex in an app |
| A monospace face for small data labels | `--font-num` for figures and codes (Cockpit, Terminal) | Only through `.num` and `.code` |
| `→` appended to link or button text | — | Never; a `RecordLink` or an `Icon name="arrowRight"` when direction matters |
| Numbered markers `01 / 02 / 03` | The `Stepper` of a wizard (a real sequence) | Only for real sequences |
| Fade-and-slide entrance on every section and card | — | None on page load; motion answers an action (open, insert, confirm) |
| Hover lift and shadow on every card | — | Hover changes the ground (`--row-hover`), nothing moves |
| Icon-only toolbars | — | Toolbar buttons carry their text (Vistas, Columnas, Exportar); icons accompany |
| Accenting one word of a headline | — | Never |
| Lorem ipsum, invented stats | — | Real content or a labelled placeholder |
