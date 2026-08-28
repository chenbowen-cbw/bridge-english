# Bridge English — Supabase

## Architecture

| Layer | Path | Role |
| --- | --- | --- |
| App shell | `web/` (Vite React) | Primary product UI |
| Client | `web/src/lib/supabase/` | Browser client + shared types (anon key only) |
| Features | `web/src/features/{auth,footprints,ai-coach}/` | Auth, footprints CRUD, coach invoke |
| Migrations | `supabase/migrations/` | Postgres schema + RLS |
| Edge | `supabase/functions/ai-coach/` | Server-side DeepSeek / mock coach |
| Prototype | root `index.html` | Reference only — do not add new product logic here |

Auth: **email + password**. Marketing (home / pricing) anonymous; footprints + coach require login.  
Subscription: store `profiles.plan_tier` only (`free` \| `daily` \| `deep`) — **no payment**.

## Env separation

| File | Contents | Git |
| --- | --- | --- |
| `web/.env` / `web/.env.local` | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | **ignored** |
| `supabase/functions/.env` | `DEEPSEEK_API_KEY` / `AI_API_KEY`, optional `DEEPSEEK_BASE_URL`, `DEEPSEEK_MODEL` | **ignored** |
| `web/.env.example` | placeholders only | committed |

**Never** put `service_role` or `sk-…` AI keys in Vite env (`VITE_*`).

## Schema (applied)

- `profiles` — `user_id`, `display_name`, `plan_tier`, `plan_focus`, …
- `learning_plans` — questionnaire JSON, goals, `tasks_progress` (tasks table later)
- `footprints` — aligns with localStorage (`body` ← `raw`, `criteria_met` ← `stdChecked`, …)
- `weekly_reviews` — `week_key`, `answers`, `focus_next`, `footprint_ids`

RLS: authenticated users only access own rows (`user_id = auth.uid()`).

## Apply / re-apply migrations

Already applied via MCP on project `ncmmwaehjeqcjgxavwjw`. To re-run from SQL file:

```bash
npx supabase link --project-ref ncmmwaehjeqcjgxavwjw
npx supabase db push
```

Or Dashboard → SQL Editor → paste `supabase/migrations/20260829000601_init_bridge_schema.sql`.

## Edge Function `ai-coach`

- JWT required
- Rejects empty draft; rejects `rewrite_full` / `ghostwrite` / `polish_final`
- With `DEEPSEEK_API_KEY` (or `AI_API_KEY`) → DeepSeek chat; on failure falls back to mock tips
- Response: `{ tips: [{tag,text}], source: "mock"|"model", meta.rewritten: false }`

Deploy + set secrets (Dashboard → Edge Functions → Secrets, or CLI):

```bash
npx supabase secrets set DEEPSEEK_API_KEY=*** --project-ref ncmmwaehjeqcjgxavwjw
npx supabase functions deploy ai-coach --project-ref ncmmwaehjeqcjgxavwjw
```

## Local run

```bash
cd web
cp .env.example .env   # fill URL + anon key
npm install
npm run dev
```

## Dashboard switches Ethan may need

1. **Authentication → Providers → Email**: enabled  
2. **Confirm email**: for local / demo, prefer **OFF** so signup returns a session immediately (otherwise confirm via email or SQL). Rate limits apply when confirm is ON.  
3. **URL configuration**: Site URL `http://localhost:5173` and production Vercel URL; redirect allow-list both  
4. **Edge Function secrets**: set `DEEPSEEK_API_KEY` (and optional `AI_API_KEY`) in Dashboard → Edge Functions → Secrets — without this, `ai-coach` returns `source: "mock"`  
5. **Vercel env**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (build-time). Never put DeepSeek key in `VITE_*`.
