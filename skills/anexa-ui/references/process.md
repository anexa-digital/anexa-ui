# Process: plan, review against the brief, build, critique

Adapted from Anthropic's `frontend-design` skill to apps built on a kit. The brief is the design (for Omnipax the
artboards «Anexa UI v0.4 — cinco direcciones» and `docs/DISENO.md`): where it fixes something, follow it exactly;
where it leaves an axis free, choose deliberately and write down why.

## 1. Plan (before any CSS)

For a new screen or skin, write ten lines first:

- **Colors**: the 4–6 base tokens with their hex (paper, surface, ink, muted, accent, second accent). Every other
  color derives from them.
- **Type**: one or two families, clearly distinct, and their roles (display, ui, figures).
- **Layout**: one sentence and an ASCII wireframe of the three templates (list + side panel, detail, dialog); say
  whether content is left aligned (always, in business apps).
- **Principles**: three sentences on what makes this one unlike the default.
- **The memorable thing**: exactly one element that carries the personality (Cockpit: lime accent and glowing
  LEDs; Ledger: Fraunces display on warm paper; Terminal: bracketed keys and the block cursor; Studio: coral pills;
  Blueprint: the stamp and the grid). Everything else stays quiet.

## 2. Review against the brief

Ask of every part: «would I have done this for any app?» If yes, it is a default, not a choice. Change it and note
the change. The defaults that give a generated page away are in `tells.md`.

## 3. Build

Compose with the kit (the ten rules of `SKILL.md`). Tokens only: no hex, no arbitrary `rounded-[…]`, `p-[…]`,
`text-[…]` in an app; a skin that needs something expresses it as a token. Motion only answers an action.

## 4. Critique

Take screenshots (`screenshots.md`), read them against the artboards with the five passes of `critique.md`, and
before closing each screen «take one accessory off». Write what was tried and discarded in `docs/DISENO.md`
(«Intentos»), so the next pass does not repeat it.

## Quality floor, without announcing it

Works at 390 px; visible focus on every control and row; contrast 4.5:1 text, 3:1 borders (the kit's
`theme.test.ts` checks the tokens); `prefers-reduced-motion` turns motion off; keyboard reaches everything a
pointer does; every action with a key also has a button.
