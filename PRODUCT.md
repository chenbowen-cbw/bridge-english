# Product

## Register

brand

## Platform

web

## Users

Primary: adults who want **日常提升** — travel talk, shows, chat, interest reading — and keep restarting English without a durable habit. Context is evenings or commute windows of ~25–45 minutes, not exam prep.

Secondary (post-MVP): workplace English, then exam/考研 tracks. Surfaces may mention them later; they do not drive IA or hero CTA now.

## Product Purpose

Bridge is a pragmatic English learning site for the AI era. It helps learners turn a small real-life English intention into a plan, practice with AI as a coach (not a ghostwriter), leave visible output footprints, and run a light weekly review — so learning stops dying at “开始”.

Success looks like: a learner describes one English micro-goal, receives a plan, completes today’s task with independent attempt → AI coaching → independent output saved as footprint, and can see progress in a weekly before/after without score-shame.

## Positioning

Real tasks + AI coaching that never outsources judgment + footprint evidence + weekly review — not another word-list or chat-bot tutor.

## Conversion & proof

- Primary CTA: describe a real-life English micro-goal → enter **计划定制** (plan customization). Not bare chat; not “开始诊断”.
- Secondary CTA: browse today’s **任务卡** or light **基线** (baseline) when not ready to commit a goal.
- The line a visitor remembers after 10 seconds: 这一次，让英语不再停在「开始」.
- Belief ladder: (1) I don’t need more willpower, I need a small real task; (2) AI here coaches after I try myself; (3) my outputs leave footprints I can trust; (4) a weekly review keeps the habit alive — so I’ll describe my goal and get a plan.
- Proof on hand: interactive prototype (notebook hero + task/coach/footprint flow); simulated data labeled as such until real learner stories exist.

## Brand Personality

Editorial notebook · warm-pragmatic · quietly confident.

Voice: like a well-used notebook and a calm coach — concrete, unhurried, never hype. Emotions: steadiness, agency, relief from restart guilt.

## Anti-references

- Purple / indigo SaaS AI-course landing pages and glow-gradient heroes.
- Word-list apps and gamified streak guilt as the whole product story.
- Chat-first “just talk to AI” tutors that rewrite whole paragraphs by default.
- Archive-wall “evidence museums” as the homepage second screen.
- Generic Inter/Roboto purple-pill startup kits.

## Design Principles

1. **Identity over fashion**: the paper-notebook + warm terracotta accent is a deliberate brand choice; preserve it rather than chasing cool-neutral SaaS trends.
2. **Show the habit, not the archive**: second screen explains how one task leaves a footprint; navigation says 足迹, not 证据库-as-museum.
3. **Judgment stays with the learner**: AI explains and prompts after an independent draft; default ban on wholesale rewrite.
4. **Plan is the front door**: hero asks for a life micro-goal and leads to 计划定制; diagnosis/baseline is supporting, not the headline CTA.
5. **Restraint with tactility**: micro-interactions (buttons, press, focus) feel physical and editorial — never a physics toy park.

## Accessibility & Inclusion

Aim for WCAG 2.2 AA on text contrast and focus visibility. Honor `prefers-reduced-motion` for all button and page motion (crossfade / instant state instead of magnetic or spring travel). Placeholder and body text must meet ≥4.5:1 on paper backgrounds. Chinese-first UI with English learning content; language switcher remains available.

## Information architecture (locked direction)

| Was | Trend |
| --- | --- |
| 证据库 | **足迹** |
| 水平诊断 / 开始诊断 | Soften to **基线** or de-emphasize; hero CTA → plan |
| — | Add **计划** entry (定制 / 今日计划) |
| 任务卡 | Keep |
| 每周复盘 | Keep; light before/after |

Main journey: **计划定制 → 今日任务 → 先独立尝试 → AI 陪练 → 独立输出存足迹 → 周复盘**.

## Persistence (v1)

- App shell: `web/` + Supabase (email/password auth)
- Learner data: `profiles`, `learning_plans`, `footprints`, `weekly_reviews` with RLS
- Subscription: `plan_tier` only (`free` / `daily` / `deep`) — no payment yet
- See `docs/supabase.md`
