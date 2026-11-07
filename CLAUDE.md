# @anexa/ui — rules for working in this repo

- **What this is**: the shared UI kit of Anexa Digital's apps (React 19 + TanStack, Tailwind 4 tokens, six skins).
  Source TSX and CSS; every app compiles it with Bun from a Git tag. Public API: `src/index.ts` (and `./charts`).
- **TanStack first**: Query, Router, Table, Form, Virtual, Store, Hotkeys. Before adding any other library, read the
  current docs at `https://tanstack.com/<lib>/latest/docs/` and the installed `node_modules/@tanstack/*/dist/*.d.ts`.
  Never shadcn, radix, base-ui or dnd-kit (column drag uses native drag events over `table.setColumnOrder`).
- **Bun only**: `bun install`, `bun run typecheck`, `bun test`, `bun run playground`. No Vite, Node or npm. On a host
  without Bun: `docker run --rm -v "$PWD":/kit -w /kit -v anexa_ui_bun_modules:/kit/node_modules oven/bun:1.4.2 sh -c "…"`.
  `bunfig.toml` refuses packages younger than 7 days.
- **Tokens only**: a component never looks at the skin; it uses `--accent`, `--control-h`, `--radius-sm`… A skin
  that needs something new adds a token in `src/styles/skins/<skin>.css` and `src/styles/base.css` gives the default.
  `src/theme.test.ts` checks contrast of every skin in both modes.
- **Texts through `t()`** with keys in `src/i18n/es-CO.ts` (English keys, Spanish values). Generic verbs are `ui.*`.
- **Design**: the skill in `skills/anexa-ui/SKILL.md` is the method (screen composition, buttons, forms, lookups,
  dates, keys, writing, audit, critique). `docs/DISENO.md` holds the tokens and details of the artboards per skin
  and what was tried. Read both before changing how something looks.
- **Comments** say why, in English, terse; code and names in English; no business data, hosts, customers or secrets
  (the repo is public).
- **Publishing**: bump `version` in `package.json`, write the `CHANGELOG.md` entry (what changed for an app),
  update `docs/ADOPCION.md` when adoption steps change, commit, `git tag vX.Y.Z && git push origin master --tags`.
  Apps install with `bun add github:anexa-digital/anexa-ui#vX.Y.Z`. After a scripted edit of `package.json`,
  validate it (`python3 -c 'import json;json.load(open("package.json"))'`).
- **Tests**: pure logic in co-located `*.test.ts` with `bun:test`; components are reviewed in the playground
  (port 5190, HMR off) and by the adopting app's e2e.
