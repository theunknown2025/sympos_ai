# Admin interface French rollout

This folder (`i18n/admin/`) is the **single home** for organizer/admin UI copy in **English** and **French**.

## Architecture

| Piece | Role |
|--------|------|
| `types.ts` | Shared types (`AdminDisplayLanguage`, bundle shape). |
| `createNamespace.ts` | Wraps `{ en, fr }` objects for consistency. |
| `core/common.ts` | Shared labels (Save, Loading, Retry, …). |
| `pages/*.ts` | **One file per product area** (dashboard, submissions, …). Each exports `*Ns` registered in `registry.ts`. |
| `registry.ts` | Merges all namespaces for the translation hook. |
| `hooks/useAdminTranslation.ts` | `const { t } = useAdminTranslation('dashboard')` → `t('organizerTitle')`, optional `{{var}}` interpolation. |

Locale is driven by **`AdminDisplaySettingsProvider`** (user preference, persisted in `mcp.json`).

## Phased plan (heavy task)

### Phase 1 — Foundation (done in repo)

- Add `i18n/admin/` layout, `registry`, `useAdminTranslation`, and `common`.
- Add **stub** page modules (`pageTitle` only) for every major area so new keys have a clear home.
- Migrate **one** high-traffic screen end-to-end as a reference implementation: **Dashboard**.

### Phase 2 — Layout shell

- Move strings from `i18n/adminNavLabels.ts` and display-settings modal copy into `pages/layoutSidebar.ts` / `pages/layoutDisplaySettings.ts` (or `core/layout.ts`) and wire `Sidebar` / modal to `useAdminTranslation` (optional cleanup; nav already reacts to `language`).

### Phase 3 — Route-by-route migration

For each route under `components/Admin/…`:

1. Add keys to the matching `pages/<area>.ts` (`en` + `fr` must share the same keys).
2. Replace hard-coded strings in TSX with `t('key')` or `t('key', { var: value })`.
3. Use `useAdminTranslation('common')` for generic buttons.

Suggested order (impact × reuse):

1. Event management, registrations, submissions (high volume).
2. Forms, landing page builder, files, emailer.
3. Certificates, academy, payments, project management.
4. Super-admin, participant/jury tools, presenter, blogs, design editor.

### Phase 4 — Quality

- Glossary for domain terms (soumission, inscription, comité, …).
- ICU-style plural rules if needed (later: lightweight helper or library).
- Optional: extract participant-facing admin strings into `i18n/admin/participant/` subfolder when files grow.

## Interpolation

Templates use `{{name}}` placeholders, e.g. `t('notifRegBody', { name: 'Ada', event: 'Conf 2026' })`.

## Adding a new page file

1. `pages/myFeature.ts` → `export const myFeatureNs = createNamespace({ en: { … }, fr: { … } })`.
2. Import in `registry.ts` and add `myFeature: myFeatureNs`.
3. In components: `useAdminTranslation('myFeature')`.
