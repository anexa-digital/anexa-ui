# Dates, numbers, money and preferences

## The rule

Values travel as the API speaks: civil dates `YYYY-MM-DD`, instants ISO with offset, amounts as decimal strings.
What people read follows their preferences (`lib/preferences.ts`): `locale`, `dateFormat` (`YYYY-MM-DD` by
default, `DD/MM/YYYY`, `MM/DD/YYYY`), `timeZone`, `currency`. The company's settings are the default; the person's
own choice overrides them; the app loads both from its API and calls `setPreferences` once per session.

| Need | Use | Never |
| --- | --- | --- |
| today | `todayIso()` (the company's zone) | `new Date().toISOString().slice(0, 10)` (UTC: tomorrow after 19:00 in Bogotá) |
| a civil date for reading | `formatDate(iso)`; short form `formatDateShort` | string slicing, `toLocaleDateString` |
| an instant | `formatDateTime(iso)`, `formatTime`, `formatRelative` | `new Intl.DateTimeFormat("es-CO", …)` inline |
| a count or a float | `formatNumber(value)` | `toLocaleString("es-CO")` |
| money | `formatMoney(amount, currency)` | `$ ${…}` by hand |
| a percent | `formatPercent(0.82)` → «82 %» | `${x}%` |
| an exact decimal string | `formatDecimal(value, digits)` | floats |
| a date field | `DateField` (text in the person's format + calendar; ISO always accepted; native on phones) | `TextField type="date"`, `<input type="date">` |
| a month | `MonthField` | — |
| a date filter in a grid toolbar | `DateInput` | — |

## Preferences in an app (Omnipax)

`GET /v1/auth/me/preferences` → `{ tenant_defaults: { locale, time_zone, currency, date_format }, preferences }`;
the app calls `setPreferences({ ...tenantDefaults, ...person })` when the session loads and when the person saves
the account screen (`PUT`). The same endpoint keeps `skin`, `mode`, `density`, `keys` (the theme follows the
person between browsers) and `grids` (`configureGridStorage` with a cache that writes through, debounced).

## Tests (e2e)

Fill a date by its label with the ISO form (`get_by_label("Desde").fill("2026-09-01")`): the kit accepts it in
every format. The e2e fixture sets the person's `date_format` to `YYYY-MM-DD` so what is read matches too.
