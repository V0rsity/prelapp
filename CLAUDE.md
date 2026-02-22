# CLAUDE.md - Prelapp

## What is this?

Prelapp is a fitness readiness and recovery tracking PWA for track and field athletes. Athletes log daily morning readiness, training sessions, and recovery activities, then review trends over time. Built with Next.js (Pages Router) and Supabase.

## Commands

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Tech Stack

- **Framework**: Next.js 16 (Pages Router), React 19, TypeScript 5
- **Database/Auth**: Supabase (PostgreSQL + auth)
- **Styling**: Tailwind CSS v4 + global CSS (`styles/globals.css`) with CSS custom properties for theme colors
- **Charts**: Recharts
- **Icons**: Lucide React
- **PWA**: Standalone manifest at `/public/manifest.json`

## Project Structure

```
pages/           # Next.js Pages Router (index, login, signup, dashboard)
components/
  dashboard/     # All dashboard components (logs, overviews, modals, trends)
config/
  metrics.ts     # Central metric definitions — single source of truth for all tracked metrics
  profiles.ts    # Athlete event type definitions (EVENT_TYPE_CONFIG, getEventTypeTitle)
  timezones.ts   # Timezone groups and labels (TIMEZONE_CONFIG, getTimezoneLabel)
context/         # AuthContext for user/session state
lib/
  supabase.ts    # Supabase client init (uses NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
types/           # TypeScript interfaces (UserProfile, DailyLog)
utils/           # Utility functions (readiness score calculation)
styles/
  globals.css    # Global styles, theme variables, component classes
public/          # PWA manifest, icons, images
```

## Database Schema

Two main tables: `users` and `daily_logs`.

**users**: id, first_name, last_name, email, timezone, created_at, is_premium, event_types[]

**daily_logs**: id, user_id, date, morning_complete, training_complete, recovery_complete, readiness_score, notes_morning, plus:
- Morning metrics: `{metric}_morning` (sleep, energy, stress, hydration, nutrition, quad, hamstring, hip, calf, shin)
- Training fields: `training_intensity`, `training_types[]`, `training_muscles[]`, `training_mileage`, `training_notes`
- Recovery fields: `recovery_activities[]`, `recovery_notes`

## Key Conventions

### Metric Configuration Pattern

All metrics are defined in `config/metrics.ts` — not hardcoded in components. Four config objects:
- `READINESS_METRIC_CONFIG` — 5 general readiness metrics (sleep, energy, stress, hydration, nutrition)
- `SORENESS_METRIC_CONFIG` — muscle soreness filtered by athlete event type
- `TRAINING_METRIC_CONFIG` — training fields with conditional visibility via `dependsOn`
- `RECOVERY_METRIC_CONFIG` — recovery activities with categories and `requiresTraining` flags

Adding a new metric requires both a config entry here AND a corresponding Supabase column.

### Component Naming

- Log forms: `[Section]Log` (TrainingLog, RecoveryLog)
- Read-only displays: `[Section]Overview` (TrainingOverview, RecoveryOverview)
- Edit modals: `Edit[Section]Modal` (EditTrainingModal)
- View modals: `View[Section]Modal` (ViewLogModal)

### File Naming

- Components: PascalCase (`MorningReadiness.tsx`)
- Utils/config: camelCase (`readinessScore.ts`, `metrics.ts`)
- Pages: lowercase (`dashboard.tsx`)

### Database Field Naming

- Morning metrics: `{metric}_morning` (e.g. `sleep_morning`)
- Training: `training_{field}` (e.g. `training_intensity`)
- Recovery: `recovery_{field}` (e.g. `recovery_activities`)
- Completion flags: `{section}_complete`

### Data Fetching & Caching

Data is cached in `sessionStorage` (`userProfile`, `dailyLogs`). Components check cache first, only querying Supabase when cache is empty. Cache is cleared on logout and on manual refresh. Tab switches call `fetchUserData()` which reads from cache.

### Event Type System

Five event types: runner, jumper, thrower, hurdler, pole_vaulter. Defined in `config/profiles.ts` as `EVENT_TYPE_CONFIG` — single source of truth for values, display titles, and descriptions. Users select types during onboarding via `ProfileSelectionModal` and can update them in Settings. Metrics and options are filtered by the user's event types throughout the app. Use `getEventTypeTitle(value)` to resolve a stored value to its display name.

Timezone options are defined in `config/timezones.ts` as `TIMEZONE_CONFIG` (grouped by region). Use `getTimezoneLabel(value)` to resolve an IANA timezone value to its display label.

### Conditional Field Visibility

Training fields use a `dependsOn` pattern — e.g., "muscles" only shows when "strength" is in the selected training types. Evaluated by `shouldShowField()` in `config/metrics.ts`.

### Dashboard Tab Pattern

All tab content is rendered simultaneously with `display: block/none` toggling (not route-based) to preserve component state across tab switches.

### Daily Log Completion Flow

Each day has three sections (morning, training, recovery). Each has a `*_complete` boolean. Incomplete sections show the Log form; completed sections show the Overview with an Edit button that opens a modal.

### Readiness Score

Weighted average of morning metrics (sleep/energy weighted 1.5x, others 1.0x, soreness 0.24x). Normalized to a 50–99 scale. Color-coded: <60 red, <70 orange, <80 yellow, <90 light-green, >=90 green. Calculated in `utils/readinessScore.ts`.

### Styling

- Tailwind for utility classes, global CSS for component-level styles and theme variables
- Inline styles used for dynamic colors (intensity colors, metric-based coloring)
- Mobile-first responsive design with fixed bottom nav on mobile and side nav buttons on desktop
- Theme colors defined as CSS custom properties (e.g. `--color-primary-bg: #BDDDFC`, `--color-dark-bg: #384959`)

### Auth Flow

- Supabase handles auth (email/password signup and login)
- `AuthContext` wraps the app, listens to `onAuthStateChange()`
- Dashboard redirects to `/` if unauthenticated; landing page redirects to `/dashboard` if authenticated
- Loading state prevents flash of wrong page

### Path Alias

`@/*` maps to the project root (configured in `tsconfig.json`).

---

## Airtable CRM Integration

### Overview

Two Airtable tables receive data from the app via server-side API routes that keep the API key secret:

| Trigger | Route | Method | Table |
|---|---|---|---|
| Signup | `POST /api/airtable` | POST (create) | Users |
| Profile selection | `POST /api/airtable` | PATCH + upsert | Users |
| Settings update (name/timezone/profiles) | `POST /api/airtable` | PATCH + upsert | Users |
| Contact form submission | `POST /api/contact` | POST (create) | Feedback |

All Airtable calls are **fire-and-forget** (`.catch(() => {})`). They never block the user's primary action.

### Field ID Config

All Airtable field IDs live in **`config/airtable.ts`** — the single source of truth. Never hardcode field names or IDs elsewhere.

```ts
AIRTABLE_USERS_FIELDS    // Users table field IDs
AIRTABLE_FEEDBACK_FIELDS // Feedback table field IDs
```

Always use field IDs (not field names) as keys in the `fields` object sent to Airtable.

### API Route Shape — `/api/airtable`

```ts
// Create (signup) — plain POST to Airtable
{ fields: { [AT.supabaseId]: id, [AT.name]: "...", ... } }

// Upsert (settings/profile) — PATCH with performUpsert
{ upsert: true, fields: { [AT.supabaseId]: id, [AT.xxx]: value } }
```

The route uses `method: upsert ? 'PATCH' : 'POST'` when calling Airtable.

### Critical Airtable API Rules — DO NOT FORGET

1. **Create = POST, Update/Upsert = PATCH.** Using POST for `performUpsert` returns `INVALID_REQUEST_UNKNOWN`. Always use PATCH for any call that includes `performUpsert`.

2. **`performUpsert` belongs on PATCH only.** Structure:
   ```json
   { "performUpsert": { "fieldsToMergeOn": ["fieldId"] }, "records": [{ "fields": { ... } }] }
   ```

3. **`fieldsToMergeOn` takes field IDs directly** (no extra flags needed when using PATCH).

4. **Multiple select values must exactly match predefined option names** (case-sensitive, underscore vs hyphen matters). App event type values: `runner`, `jumper`, `thrower`, `hurdler`, `pole_vaulter` — Airtable options must match these exactly.

5. **Do not send date fields with time components** to a Date-only Airtable field — use `YYYY-MM-DD` format only.

6. **`createdAt` and `submittedAt` are defaulted in Airtable** — do not send them from the app.

### Environment Variables

```
AIRTABLE_API_KEY=
AIRTABLE_BASE_ID=
AIRTABLE_USERS_TABLE_ID=
AIRTABLE_FEEDBACK_TABLE_ID=
```
