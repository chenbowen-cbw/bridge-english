# Bridge English — Supabase

## Architecture

| Layer | Path | Role |
| --- | --- | --- |
| App shell | `web/` (Vite React) | Primary product UI |
| Client | `web/src/lib/supabase/` | Browser client + shared types (anon key only) |
| Features | `web/src/features/{auth,plans,footprints,reviews,ai-coach}/` | Auth, plan wizard, footprints CRUD, weekly review, coach invoke |
| Migrations | `supabase/migrations/` | Postgres schema + RLS |
| Edge | `supabase/functions/ai-coach/` | Server-side DeepSeek / mock coach（日配额） |
| Prototype | `prototype/` | Reference only — localStorage keys use `bridge-proto-*` |

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
- Per-user daily quota via `bump_ai_coach_daily`（默认 20；可用 `AI_COACH_DAILY_LIMIT` 覆盖）
- Rejects empty draft; rejects `rewrite_full` / `ghostwrite` / `polish_final`
- With `DEEPSEEK_API_KEY` (or `AI_API_KEY`) → DeepSeek chat; on failure falls back to mock tips
- Response: `{ tips: [{tag,text}], source: "mock"|"model", meta.rewritten: false }`

`profiles.plan_tier` is **server-managed**: clients cannot UPDATE that column (column grants + trigger).

Deploy + set secrets (Dashboard → Edge Functions → Secrets, or CLI):

```bash
npx supabase secrets set DEEPSEEK_API_KEY=*** --project-ref ncmmwaehjeqcjgxavwjw
npx supabase functions deploy ai-coach --project-ref ncmmwaehjeqcjgxavwjw
```

## Vercel

- Project: `bridge-english` · Root Directory: `web`
- Production: https://bridge-english-two.vercel.app
- Set Dashboard env (recommended override): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Client also ships public anon fallbacks for the linked project so preview works before env is filled
- DeepSeek key: Supabase Edge Function Secrets only (`DEEPSEEK_API_KEY`) — never Vercel `VITE_*`

After changing Auth settings, add Site URL / Redirect:
`https://bridge-english-two.vercel.app`

## Dashboard switches Ethan may need

1. **Authentication → Providers → Email**: enabled  
2. **Confirm email → OFF**（演示必备）  
   - Path: [Dashboard](https://supabase.com/dashboard/project/ncmmwaehjeqcjgxavwjw/auth/providers) → **Authentication → Providers → Email → Confirm email** 关掉  
   - 等价字段：`mailer_autoconfirm: true`（自动确认 = 不要求点邮件）  
   - MCP **无法**改 Auth 配置；本地 `supabase/config.toml` 已写 `enable_confirmations = false`，但 **不会自动同步到云端**  
   - 有 Personal Access Token 时可用 Management API：

```bash
# Token: https://supabase.com/dashboard/account/tokens
curl -X PATCH "https://api.supabase.com/v1/projects/ncmmwaehjeqcjgxavwjw/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mailer_autoconfirm": true}'
```

3. **URL configuration**: Site URL 建议生产 `https://bridge-english-two.vercel.app`；Redirect allow-list 同时包含该 URL 与本地 `http://localhost:5173`（确认邮件链接的 Site URL 错了会出现 `/verify` 失效）  
4. **Edge Function secrets**: set `DEEPSEEK_API_KEY` (and optional `AI_API_KEY`) in Dashboard → Edge Functions → Secrets — without this, `ai-coach` returns `source: "mock"`  
5. **Vercel env**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (build-time). Never put DeepSeek key in `VITE_*`.
