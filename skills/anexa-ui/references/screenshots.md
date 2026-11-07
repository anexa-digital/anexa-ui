# Screenshots for the critique

A picture of each screen in two skins and two widths, read next to the artboards, is the critique's raw material.

For Omnipax the script is `tools/ui_screenshots.py` (Playwright, Python) run in the e2e runner image against the
local stack (see the memory `test-server-dev-tooling` and `tests/e2e/conftest.py` for the login):

```bash
docker run --rm --network host -v "$PWD":/src -w /src -v <env>:/src/.env:ro -v omnipax_dev_venv:/venv \
  -e UV_PROJECT_ENVIRONMENT=/venv -e OMNIPAX_E2E_BASE_URL=http://127.0.0.1:5181 -e TZ=America/Bogota \
  omnipax-e2e-runner:dev sh -c "uv pip install --python /venv/bin/python playwright; /venv/bin/python tools/ui_screenshots.py --out /src/var/screenshots"
```

What it captures: Inicio, a list with its panel open, a detail, a confirmation, the palette, the «?» dialog, in
Cockpit dark, Cockpit light, Ledger and Terminal, at 1440 and 390 px. The skin is set before load through
`localStorage` (`anexa_skin`, `anexa_theme`), as the app's `index.html` reads it.

Then open each PNG (the Read tool shows images) with the artboard of the same skin beside it
(`project/<Skin>.dc.html` of the design canvas) and fill the table of `critique.md`.

For another app, copy the script and change the routes and the login.
