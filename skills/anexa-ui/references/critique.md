# Critique: reading a built screen

The five passes of the Design plugin's `design-critique`, applied to screenshots (see `screenshots.md`) next to
the artboards. Write findings in a table: screen · pass · finding · severity (P0 blocks use, P1 hurts a task, P2
polish) · fix. Also write what works, so it is not «fixed» away.

1. **First impression** (3 seconds): what is the screen for, what is the one thing to do, is the hierarchy
   obvious? Is the memorable element of the skin visible and alone?
2. **Usability**: can the main task be done with the keyboard only; is «Nuevo» where rule 3 says; does ⏎ open
   a row; does Esc close; are the destructive actions apart and confirmed or undoable; does every mutation answer?
3. **Visual hierarchy**: title → context → actions → content; one primary button; numbers aligned right in
   `.num`; codes in `.code`; the panel at 380 px; the grid as one card; nothing wrapped twice.
4. **Consistency**: same radius scale, same control heights, same button classes, same chip, same badge tones,
   same link style, same empty state, same pager hint; texts follow `writing.md`.
5. **Accessibility**: focus visible, labels on every control, `aria-sort` on headers, `role=dialog` with a name,
   contrast of the new tokens, 390 px works, reduced motion respected (`a11y.md`).

Then the Chanel rule: before closing a screen, remove one accessory (a border, a badge, a shadow, a word).
