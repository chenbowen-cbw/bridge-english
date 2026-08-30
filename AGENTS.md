# Bridge English — Agent 说明书

> 给后续 AI agent 的项目入口。本仓库主文件为 `AGENTS.md`（业界常见命名）；后续工具与约定以本文件为准。

更细的产品/设计/后端见：`PRODUCT.md` · `DESIGN.md` · `docs/supabase.md` · `README.md`。

---

## 1. 产品是什么

**Bridge** 是 AI 时代的务实英语学习站（纸质笔记本编辑风）。不是词表 App，也不是「整段代写」的聊天辅导。

**MVP 人群**：想日常提升（旅行开口、追剧、闲聊、兴趣阅读）、反复「开始」却养不成习惯的成人。场景约晚间/通勤 25–45 分钟；**不是**考试/考研主路径（职场、考研为次要，不驱动 IA/主 CTA）。

**方法原则（硬）**

1. **真实任务** — 生活微目标 → 计划 → 今日任务卡  
2. **先独立稿** — 学习者先写，再开 AI  
3. **AI 不代写** — 只点拨；禁止整段改写 / ghostwrite / polish_final  
4. **练习** — 独立输出可见留存（导航叫「练习」，不是证据博物馆）  
5. **周复盘** — 轻量 before/after，不搞分数羞辱  

主旅程：`计划定制 → 今日任务 → 先独立尝试 → AI 陪练 → 独立输出存练习 → 周复盘`。

主 CTA：描述生活微目标 → **定制计划**（不是「开始诊断」、不是裸聊）。

---

## 2. 技术栈与部署

| 层 | 位置 | 说明 |
| --- | --- | --- |
| 主应用 | `web/` | Vite + React 19 + TypeScript；唯一产品代码路径 |
| 原型 | `prototype/` | **仅参考**；localStorage 前缀 `bridge-proto-*`，勿当生产 |
| 后端 | Supabase | Auth（邮箱密码）、Postgres + RLS、Edge Function `ai-coach` |
| AI | DeepSeek（Edge Secrets） | 无 key 时 mock tips；`source: "mock"\|"model"` |
| 部署 | Vercel | Root Directory = `web` |

- **生产 URL**：https://bridge-english-two.vercel.app  
- **GitHub**：https://github.com/chenbowen-cbw/bridge-english  
- **Supabase project-ref**：`ncmmwaehjeqcjgxavwjw`（见 `docs/supabase.md`）

订阅目前只存 `profiles.plan_tier`（`free` / `daily` / `deep`）——**支付未接**。

---

## 3. 目录地图（改哪里）

```
bridge-english/
├── AGENTS.md                ← 本文件
├── PRODUCT.md / DESIGN.md   ← 战略 & 设计 tokens
├── README.md / docs/supabase.md
├── web/                     ← ★ 主应用
│   ├── .env.example         ← 复制为 .env（勿提交真实值）
│   ├── vercel.json          ← SPA rewrite → index.html
│   └── src/
│       ├── App.tsx          ← react-router 路由表（勿再堆单页长滚动）
│       ├── App.css / index.css
│       ├── layouts/         ← MarketingLayout · AppLayout
│       ├── pages/           ← marketing/* · app/* · LoginPage
│       ├── content/         ← 营销文案 / 价卡常量（静态）
│       ├── components/      ← BridgeButton、NotebookReveal、amicro
│       ├── lib/supabase/    ← browser client（仅 anon）+ types
│       └── features/
│           ├── auth/        ← 登录注册、AuthProvider、RequireAuth
│           ├── plans/       ← 计划问卷 → learning_plans
│           ├── footprints/  ← 练习 CRUD（代码目录/表名不改；localStorage 按用户隔离 + 云端）
│           ├── reviews/     ← 周复盘 → weekly_reviews
│           ├── profile/     ← 只读 plan_tier 展示
│           └── ai-coach/    ← 调用 Edge Function
├── supabase/
│   ├── migrations/          ← schema、RLS、plan_tier 锁、配额 RPC
│   └── functions/ai-coach/  ← 陪练硬边界 + 日配额
├── prototype/               ← 静态原型参考（勿往这里加产品功能）
└── scripts/smoke-supabase.mjs
```

**新功能**：只进 `web/src/features/`（及必要的 `lib/` / `components/` / `pages/`）。  
**Schema / RLS / 配额**：`supabase/migrations/`。  
**陪练边界与提示词**：`supabase/functions/ai-coach/`。

### 路由约定（同域分离）

| 路径 | Layout | 说明 |
| --- | --- | --- |
| `/` `/method` `/pricing` `/login` | MarketingLayout | 营销站：Hero、方法故事、价卡；**禁止**挂载 PlanWizard / FootprintsPanel CRUD / WeeklyReviewPanel |
| `/app` | AppLayout | 今日：有 active plan 摘要；无则引导定制 |
| `/app/plan` | AppLayout + 登录 | 完整计划问卷 |
| `/app/footprints` | AppLayout | 练习；未登录可存 **1 条**本机匿名草稿；`?template=` 选模板 |
| `/app/review` | AppLayout + 登录 | 周复盘 |

- 两套壳互不混装：**营销是顶栏**（方法 · 定价）；**产品是左栏工作台**（功能入口 + 最近练习会话），不要顶栏横向「今日/计划/练习/复盘」。
- Logo：营销 `bridge.` → `/`；工作台左栏 `bridge.` → `/app`。
- 营销右侧：未登录 = `登录`（`/login?next=/app`，已有 next 则尊重）+ `定制计划`（`/login?next=/app/plan`，可带 goal）；已登录 = **进入工作台**（有 active plan → `/app`，无 → `/app/plan`），退出放账户菜单。
- 产品左栏下：只读「当前：草稿本/日常本/深练本」+ 账户菜单（退出、回到首页 `/`）。不要在顶栏钉「官网」。
- 左栏「最近练习」点一条 → `/app/footprints?id=` 选中该条练习。未登录浅试也用这套壳。
- 登录落地：有 `next` 用 `next`；否则有 active plan → `/app`，无 → `/app/plan`
- 未登录进 `/app/plan` `/app/review` 仍 RequireAuth；练习允许匿名浅试。
- Vercel：`web/vercel.json` 已 rewrite 全部路径到 `index.html`

| 从 | 动作 | 到 |
| --- | --- | --- |
| 营销未登录 · 定制计划 | CTA | `/login?next=/app/plan` |
| 营销已登录 · 进入工作台 | CTA | `/app` 或 `/app/plan` |
| 营销 · 方法/定价 | 顶栏 | `/method` `/pricing` |
| 产品 · 今日/计划/练习/复盘 | 左栏 | `/app` `/app/plan` `/app/footprints` `/app/review` |
| 产品 · 最近练习 | 左栏会话 | `/app/footprints?id=` |
| 产品 · 回到首页 | 左栏账户菜单 | `/` |
| 产品 · logo | 左栏顶 | `/app` |
| 营销 · logo | | `/` |

---

## 4. 硬约束（违反即错）

### 密钥与 Git

- `web/.env` 仅 `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`（已在 `.gitignore`）  
- **禁止**把 `service_role`、`DEEPSEEK_API_KEY` / `sk-…` 放进任何 `VITE_*` 或提交到 git  
- AI key：`supabase/functions/.env` 或 Dashboard → Edge Function Secrets  

### 数据与权限

- 表默认 **RLS**：用户只能碰自己的行（`user_id = auth.uid()`）  
- **`plan_tier` 不可客户端改**（列级 GRANT + `guard_plan_tier` trigger）；勿在前端「升级套餐」写库  
- 练习 localStorage：**按用户隔离** — `bridge-footprints:${userId}` / `bridge-footprints:anon`（key 不改）；勿混账号、勿写回未加用户后缀的全局 key  
- 原型 key 前缀 `bridge-proto-*`，与生产切断  

### AI 陪练（`ai-coach`）

- 需 JWT；空稿拒绝；`rewrite_full` / `ghostwrite` / `polish_final` 拒绝  
- 日配额默认 20（`bump_ai_coach_daily`；可用 `AI_COACH_DAILY_LIMIT`）  
- 响应强调 `meta.rewritten: false`；UI 必须先独立尝试再调 coach  

### 产品边界

- 未接支付 / 订阅扣款 — 不要假装已接或加假结账流当真  
- 不要把 `prototype/` 当生产源，也不要恢复根目录旧 HTML 原型当主路径  

---

## 5. 设计（跟 `DESIGN.md`）

- **气质**：打开的横线笔记本 — cream paper、中缝阴影、暖 terracotta `#905831`、打字机 wordmark `bridge.`  
- Tokens：`paper` / `ink` / `muted` / `accent`；字体 Special Elite（字标）+ Geist（UI）+ Caveat/Long Cang（仅装饰手写）  
- 主按钮：墨色 pill + 克制 magnetic / glare / press；尊重 `prefers-reduced-motion`  

**禁止**

- 紫 / indigo SaaS、glow、gradient 炫字  
- 整页物理玩具、hero 里卡片网格当故事  
- Inter / Playfair 等默认 AI 栈替换品牌字体  
- 把「证据库博物馆」做成首页第二屏；第二屏讲「一张任务如何留下痕迹」  

---

## 6. 常用命令

```bash
# 开发
cd web
cp .env.example .env   # 填 VITE_SUPABASE_*
npm install
npm run dev            # 默认 http://localhost:5173

npm run build
npm run lint
npm run preview

# Smoke（需可读 web/.env）
node scripts/smoke-supabase.mjs

# Supabase（已 link 时）
npx supabase db push
npx supabase functions deploy ai-coach --project-ref ncmmwaehjeqcjgxavwjw
npx supabase secrets set DEEPSEEK_API_KEY=*** --project-ref ncmmwaehjeqcjgxavwjw
```

Vercel：改 `web/` 后 push `main` 即部署；Dashboard 建议配置 `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`（构建期）。Auth Site URL / Redirect 含生产 URL 与本地 `http://localhost:5173`。演示环境建议关闭 Confirm email（见 `docs/supabase.md`）。

---

## 7. 环境变量名（无真实 secret）

| 变量 | 放哪 | 用途 |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | `web/.env` / Vercel | 项目 URL |
| `VITE_SUPABASE_ANON_KEY` | 同上 | 浏览器 anon（可公开，仍勿滥用） |
| `DEEPSEEK_API_KEY` 或 `AI_API_KEY` | Edge Secrets | 模型调用 |
| `DEEPSEEK_BASE_URL` / `DEEPSEEK_MODEL` | 可选 Secrets | 覆盖默认 |
| `AI_COACH_DAILY_LIMIT` | 可选 Secrets | 覆盖日配额 |

---

## 8. 不要做的事（速查）

1. 不要接真支付或让用户客户端自改 `plan_tier`  
2. 不要让 AI 整段代写 / 终稿抛光；不要弱化「先独立稿」  
3. 不要把密钥、service_role 写进前端或 git  
4. 不要在 `prototype/` 或根 HTML 上堆产品功能  
5. 不要改成紫渐变 SaaS 皮，或丢掉笔记本 tokens  
6. 不要破坏 RLS / 配额 / plan_tier 锁 / 按用户隔离的 localStorage  
7. 不要用考试/词表/连胜羞辱叙事替换「真实任务 + 练习 + 周复盘」主故事  

---

## 9. 动手前 30 秒清单

1. 读本文件 + 相关 `PRODUCT`/`DESIGN`/`docs/supabase` 小节  
2. 改代码落在正确目录（几乎总是 `web/src/features/…`）  
3. 涉及数据/AI：核对 RLS、边界、配额、密钥分离  
4. 本地 `npm run dev`；需要时跑 smoke / build  
5. 用户持续约定：可自行 **commit + push `main`**（勿 force；勿提交 `.env`）  
