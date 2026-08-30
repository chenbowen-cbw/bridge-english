# Bridge English

AI 时代务实英语学习站 — 纸质笔记本编辑风。应用主路径在 **`web/`**（Vite React + Supabase）。

## 本地预览

```bash
cd web
cp .env.example .env   # 填写 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

交互原型已移至 **`prototype/`**（与产品 app 切断 localStorage key，前缀 `bridge-proto-*`）。新功能只进 `web/src/features/`。

## 架构速览

| 路径 | 作用 |
| --- | --- |
| `web/src/lib/supabase/` | 浏览器 client + 类型（仅 anon） |
| `web/src/features/auth/` | 邮箱密码登录 / 注册 |
| `web/src/features/plans/` | 计划定制问卷 → `learning_plans` |
| `web/src/features/footprints/` | 练习 CRUD（代码目录/表名不改；按用户隔离的 localStorage + 云端） |
| `web/src/features/reviews/` | 周复盘 MVP → `weekly_reviews` |
| `web/src/features/ai-coach/` | 调用 Edge Function（日配额） |
| `supabase/migrations/` | Schema + RLS + GRANTs |
| `supabase/functions/ai-coach/` | DeepSeek / mock 陪练（硬边界） |
| `prototype/` | 静态原型参考 |

详情见 [`docs/supabase.md`](docs/supabase.md)。

## 密钥

- 前端：`web/.env` 只有 `VITE_SUPABASE_*`（已 gitignore）
- AI：`supabase/functions/.env` 或 Dashboard Secrets 中的 `DEEPSEEK_API_KEY` — **禁止** `VITE_` 前缀、禁止进 git

## Smoke 测试

```bash
node scripts/smoke-supabase.mjs
```

需本机可读 `web/.env`；若开启邮箱确认，新注册可能无 session（见 docs）。

## 设计文档

- `PRODUCT.md` — 战略 / IA
- `DESIGN.md` — tokens 与反模式

## 生产

- https://bridge-english-two.vercel.app （Vercel Root Directory = `web`）
