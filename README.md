# KiDent — Child Oral Health Tracker

A PWA that helps parents track **Early Childhood Caries (ECC)** risk for children
aged 2–13. Parents add a child, log a daily entry (diet, oral habits, fluoride
exposure), and get a risk score + recommendations from a client-side logistic
regression model. The app is installable on Android/desktop and (with a manual
step) iOS, works offline, and can send daily reminder push notifications.

Stack: **React 18 + Vite + TypeScript + Tailwind + shadcn/ui + framer-motion**,
backend on **Supabase** (Postgres + Auth + Edge Functions), hosted on **Vercel**.

---

## 1. Local development

```bash
cp .env.example .env      # fill in your Supabase values (see below)
npm install
npm run dev               # http://localhost:8080
npm run build && npm run preview   # test the production build + service worker
```

> The service worker is **disabled in `vite dev`** (see `devOptions.enabled` in
> `vite.config.ts`). To test install/offline/push locally, run
> `npm run build && npm run preview`.

### Environment variables

| Var | Where | Notes |
|-----|-------|-------|
| `VITE_SUPABASE_URL` | client | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | client | anon/publishable key (safe to expose) |
| `VITE_SUPABASE_PROJECT_ID` | client | project ref |
| `VITE_VAPID_PUBLIC_KEY` | client | **public** VAPID key for push |

`.env` is git-ignored — set these in the Vercel dashboard for production.

---

## 2. Backend & data collection for analysis

### Per-user data (unchanged, private)
`children` and `daily_entries` are protected by Row-Level Security: a parent can
only ever read/write **their own** child's records.

### Anonymized research dataset (new)
To analyze trends **across users** without weakening that privacy, every write to
`daily_entries` is mirrored by a database trigger into a separate, de-identified
table: **`research_entries`**.

- **No name, no `user_id`.** Each child is represented by a non-reversible
  pseudonym = `sha256(child_id || secret_pepper)`.
- Captures `age_group`, `gender`, `entry_date`, the full `diet_data` /
  `oral_habits_data` / `fluoride_data` JSON, and the `risk_score`.
- RLS is **on with no policies**, so it is invisible to the anon/authenticated
  API keys. Only the **`service_role`** key (Supabase SQL editor, server-side
  exports, Edge Functions) can read it — that is your researcher access path.

> ⚠️ Before launch, edit the migration and change the pepper in
> `private.research_pepper()` to a secret value, and keep it secret.

#### Applying the migrations
```bash
# With the Supabase CLI linked to your project:
supabase db push
# …or paste supabase/migrations/20260625120000_research_dataset_and_push.sql
# into the Supabase SQL editor.
```

#### Analyzing the data (run with the service_role key / SQL editor)
```sql
-- Pre-built aggregate views:
select * from research_risk_by_age;     -- avg/median risk by age group & gender
select * from research_daily_volume;    -- entries & active children per day

-- Or query the raw de-identified rows:
select age_group, gender, risk_score, diet_data
from research_entries
order by created_at desc;
```
Export to CSV from the SQL editor, or pull via the service_role key from a
notebook (pandas, R, etc.) for deeper modeling.

---

## 3. PWA: install + offline

Implemented with `vite-plugin-pwa` (Workbox). The production build emits a
service worker (`/sw.js`) that precaches the app shell and uses a
**network-first** strategy for Supabase calls so the app keeps working offline.

- **Android / Desktop Chrome / Edge:** an **“Install app”** button appears on the
  Home screen (via the `beforeinstallprompt` event), plus the browser's own
  install prompt. Installs as a WebAPK with its own icon.
- **iOS / iPadOS:** Apple does **not** fire an install prompt and Chrome on iOS
  cannot install PWAs (all iOS browsers are WebKit). Install is manual:
  **Safari → Share → “Add to Home Screen.”** The app shows a hint for this.
  Once added, it launches standalone (`apple-mobile-web-app-capable`).

---

## 4. Push notifications (daily reminders)

1. **Generate VAPID keys** (once):
   ```bash
   npx web-push generate-vapid-keys
   ```
2. **Client:** put the **public** key in `VITE_VAPID_PUBLIC_KEY`. The Home screen
   “Enable daily reminders” toggle (`src/components/PwaControls.tsx`) requests
   permission, subscribes via the service worker, and stores the subscription in
   the RLS-protected `push_subscriptions` table.
3. **Server:** set the Edge Function secrets and deploy:
   ```bash
   supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:you@example.com
   supabase functions deploy send-push
   ```
4. **Send** (test or via a scheduled cron):
   ```bash
   curl -X POST "$SUPABASE_URL/functions/v1/send-push" \
     -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
     -H "Content-Type: application/json" \
     -d '{"title":"KiDent","body":"Log today'\''s entry 🦷"}'
   ```
   Omit `user_id` to broadcast; include it to target one user. Schedule a daily
   reminder with Supabase's cron (pg_cron / scheduled functions).

> **iOS caveat:** web push only works on iOS **16.4+** and only after the app has
> been added to the Home Screen.

The push/notification-click logic lives in `public/push-handler.js`, imported
into the generated service worker.

---

## 5. Deploying to Vercel

1. Push this repo to GitHub and **Import Project** in Vercel.
2. Framework preset: **Vite** (`vercel.json` already pins build/output + SPA
   rewrites + correct service-worker headers).
3. Add the four `VITE_*` environment variables in **Project → Settings →
   Environment Variables**.
4. Deploy. HTTPS is automatic — required for service workers and push.

---

## Project layout (key files)

```
src/
  components/PwaControls.tsx     # install button + reminders toggle
  lib/push.ts                    # web-push subscribe/unsubscribe helpers
  lib/riskCalculator.ts          # client-side ECC logistic-regression model
  pages/                         # Home, DailyEntry, History, Auth, …
public/
  manifest.json                  # PWA manifest
  push-handler.js                # SW push + notificationclick handlers
supabase/
  migrations/                    # children, daily_entries, research_entries, push_subscriptions
  functions/send-push/           # Edge Function that sends web push
vercel.json                      # hosting config
```
