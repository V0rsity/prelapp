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
types/           # TypeScript interfaces (UserProfile, DailyLog — fields derived from metrics.ts)
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

Adding a new metric requires a config entry here AND a corresponding Supabase column. `DailyLog` in `types/models.ts` **automatically derives** training and recovery fields from the config via TypeScript mapped types — no manual update to `models.ts` needed for `TRAINING_METRIC_CONFIG` or `RECOVERY_METRIC_CONFIG` entries. Morning metric fields (`{key}_morning`) are also auto-derived from `READINESS_METRIC_CONFIG` and `SORENESS_METRIC_CONFIG`. The `inputType` on each config entry determines the TypeScript field type: `"dropdown"`/`"mileage"` → `number | null`, `"multiselect"` → `string[] | null`, `"textarea"` → `string | null`.

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

### Trends Component (`components/dashboard/Trends.tsx`)

Three sections, each in its own `main-container`:

1. **Habit Tracker** — GitHub-style calendar heatmap. Each cell is one day; color reflects the selected metric value via `getHabitCellColor`. Covers from the earliest logged date (aligned to Sunday) through end of the current week; dates outside that window or after today render transparent.

2. **Track Progress** — Bar chart for a single metric with per-bar color-coding and an optional dashed linear best-fit trend line (`Line` overlaid inside a `BarChart`). Displays a `%` change badge when the trend line has ≥2 valid points.

3. **Compare Trends** — Dual-metric area/line chart on a shared 0–5 Y-axis. Metric 1 = blue area, Metric 2 = yellow line.

**Habit metric key namespace** — used in the selector and `getHabitCellColor`:
- `readiness_score` — computed score
- `readiness_{key}_morning` — from `READINESS_METRIC_CONFIG`
- `soreness_{key}_morning` — from `SORENESS_METRIC_CONFIG`
- `training_intensity`
- `training_type_{key}` — presence in `training_types[]`
- `recovery_activity_{key}` — presence in `recovery_activities[]`

**Subtype**: `training_type_strength` exposes a secondary `habitSubtype` selector for muscle groups. Passed to `getHabitCellColor` to filter by specific muscle.

**`findEarliestDataDate`**: Trims leading empty dates from bar/line chart data so charts start at the first day with any logged data.

**`groupedMetrics`**: Builds the metric dropdown options for Track Progress and Compare Trends. Organized into three `<optgroup>` categories — Readiness, Training, Soreness. Both Training and Soreness entries are filtered by `userProfile.event_types`. Training metric availability is derived from the config — e.g. `training_mileage` only appears if the user has any event type in `TRAINING_METRIC_CONFIG.types.options.distance.eventTypes`. `availableMetrics` is a flat version (via `flatMap`) used only for label lookups.

---

### Adding a New Numeric Metric to Track Progress & Compare Trends

When a new numeric field is added to `daily_logs` and logged via a form, expose it in the Trends charts by updating **only `components/dashboard/Trends.tsx`**:

**1. Add to `groupedMetrics`** — append an entry to the appropriate group's `options` array (or create a new group):
```ts
{ value: 'your_field_name', label: 'Display Label' }
```
The `value` must exactly match the `DailyLog` field name so `log[barMetric as keyof DailyLog]` reads it correctly.

**2. Handle the Y-axis in Track Progress** — update the `domain`/`ticks` ternary on the `<YAxis>` inside the `<BarChart>`:
- 1–5 scale: falls through to the default `[0, 5]` with integer ticks — no change needed
- Custom range (e.g. 0–100, or auto): add a case like `barMetric === 'your_field' ? [0, 'auto'] : ...`

**3. Handle bar colors in Track Progress** — update the `fill` ternary on `<Cell>` and the `backgroundColor` ternary in the legend `<div>`:
- 1–5 quality scale: falls through to `getBarColor(value, false)` — no change needed
- Custom colors (like intensity uses its config colors): add a case
- Single neutral color: add `barMetric === 'your_field' ? '#hexcolor' : ...`

**4. Handle the tooltip in `BarCustomTooltip`** — update the `displayValue` formatting block:
- 1–5 scale: falls through to `toFixed(0) + '/5'` — no change needed
- Custom unit (e.g. miles, seconds): add `else if (barMetric === 'your_field') displayValue = value.toFixed(2) + ' unit'`
- Label lookup (e.g. intensity): add a case that maps numeric value to a string label

**5. Handle normalization in `chartData` (Compare Trends)** — if the field has a range other than 1–5, normalize it to 0–5 for the shared Y-axis. Pattern used for mileage:
```ts
if (metric1 === 'your_field' && m1Value !== null)
  m1Value = (m1Value as number) / maxYourField * 5;
```
Compute `maxYourField` with a `useMemo` that scans all `dailyLogs`. Also add the reverse in `CustomTooltip` to show the real value on hover.

**6. Update `CustomTooltip` (Compare Trends)** — add a case to format the display value correctly (reverse any normalization, add units, or do label lookup).

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
