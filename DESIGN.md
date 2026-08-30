---
name: Bridge
description: Paper-notebook English learning — warm editorial, not purple SaaS
colors:
  ink: "#1a1a1a"
  ink-deep: "#0a0a0a"
  muted: "#5c5348"
  accent: "#905831"
  accent-deep: "#7a4a29"
  paper: "#fdfbf5"
  paper-deep: "#f6f0e3"
  paper-edge: "#e7dfcc"
  rule: "#c4b498"
  surface-glass: "#fffffff0"
  on-ink: "#fafafa"
typography:
  display:
    fontFamily: "Special Elite, Georgia, serif"
    fontSize: "clamp(2.5rem, 6vw, 4.125rem)"
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  wordmark:
    fontFamily: "Special Elite, Georgia, serif"
    fontSize: "1.625rem"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0.01em"
  body:
    fontFamily: "Geist, PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "Geist, PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "0.06em"
  script-en:
    fontFamily: "Caveat, Georgia, serif"
    fontSize: "1.25rem"
    fontWeight: 400
    lineHeight: 1.75
  script-zh:
    fontFamily: "Long Cang, Caveat, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 400
    lineHeight: 1.75
rounded:
  sm: "8px"
  md: "16px"
  lg: "24px"
  pill: "999px"
  prompt: "44px"
spacing:
  xs: "8px"
  sm: "16px"
  md: "24px"
  lg: "44px"
  xl: "56px"
components:
  button-primary:
    backgroundColor: "{colors.ink-deep}"
    textColor: "{colors.on-ink}"
    rounded: "{rounded.pill}"
    padding: "14px 26px"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "#2a2a2a"
    textColor: "{colors.on-ink}"
  button-primary-active:
    backgroundColor: "{colors.ink-deep}"
    textColor: "{colors.on-ink}"
  button-nav-cta:
    backgroundColor: "{colors.ink-deep}"
    textColor: "{colors.on-ink}"
    rounded: "{rounded.pill}"
    padding: "11px 20px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "10px 18px"
  button-hero:
    backgroundColor: "{colors.ink-deep}"
    textColor: "{colors.on-ink}"
    rounded: "{rounded.prompt}"
    height: "56px"
    width: "168px"
---

## Overview

Bridge reads as an **open ruled notebook**: cream paper spreads, a center spine shadow, warm terracotta (`#905831`) accents, and a typewriter wordmark `bridge.`. This cream/sand body is an **intentional identity choice** (paper as product metaphor), not an unexamined AI-default warm beige. Identity-preservation wins over the impeccable cream-band warning for greenfield work.

Color strategy: **Restrained** — tinted paper neutrals + ink + one warm accent ≤10%. Motion stays editorial and tactile (magnetic pull, glare, press spring) on primary actions only — never a full-page physics playground.

Register: brand (marketing homepage / prototype shells). Platform: web.

## Colors

| Token | Hex | Role |
| --- | --- | --- |
| `paper` / `paper-deep` | `#fdfbf5` → `#f6f0e3` | Notebook page fill |
| `paper-edge` | `#e7dfcc` | Page border / spine cues |
| `rule` | `#c4b498` | Ruled lines (low chroma) |
| `ink` / `ink-deep` | `#1a1a1a` / `#0a0a0a` | Body + primary pills |
| `muted` | `#5c5348` | Supporting copy (≥4.5:1 on paper; avoid washed `#767676` on cream) |
| `accent` | `#905831` | Nav active, kickers, labels |

Anti-palette: no purple/indigo gradients, no neon glow, no cool slate SaaS chrome as the body.

## Typography

- **Wordmark / display personality**: Special Elite (typewriter) — already committed; keep for identity.
- **UI / body**: Geist + system CJK.
- **Notebook ink theatrical**: Caveat (EN) / Long Cang (ZH) only inside decorative page fills, not UI chrome.
- Headings: `text-wrap: balance`; body max ~65–75ch where prose runs long.
- Do not swap to Inter / Playfair / Fraunces reflex stacks.

## Elevation

Paper is the primary elevation language: soft page shadow `0 18px 40px rgba(60,45,20,.12)` and inset warmth. Primary buttons use ink fill + brief glare and expand-ring on hover; avoid multi-layer neon shadows. Glass cards from the prototype are secondary surfaces — prefer paper/ruled continuity on the brand homepage when choosing between glass and notebook.

## Components

### Buttons (amicro-informed, Bridge-restrained)

Primary / nav CTA / hero CTA share one interaction kit:

1. **Magnetic field** (desktop): button eases toward cursor within ~45px, strength ~0.3, spring return.
2. **Glare shine**: diagonal specular sweep on hover (~500ms, ease-out-quart).
3. **Slide arrow**: trailing → or ↑ icon translates 3–5px on hover.
4. **Press**: scale ~0.96 with spring settle; expand ring on pointer-down.
5. **Focus**: 2px accent ring, offset 3px — never remove outline without replacement.
6. **Reduced motion**: disable magnetic/glare/ring; keep color + opacity feedback only.

Ghost buttons: hairline border, muted fill on hover, same press/focus rules without glare.

### Hero prompt

Large rounded prompt surface; editable goal copy; hero CTA label = plan entry (e.g. **定制计划**), not 开始诊断.

### Navigation

Wordmark left; Chinese labels (首页 / 计划 / 任务 / 练习 / 复盘); accent for current; ink pill CTA = same plan verb as hero.

## Do's and Don'ts

**Do**

- Keep the open-notebook hero as the brand first viewport.
- Treat warm paper + terracotta as locked brand physics.
- Spend motion budget on CTAs and task completion, not every section fade-up.
- Second screen: “一张任务如何留下痕迹” — footprint narrative, not archive wall.

**Don't**

- Don’t restyle into purple AI-course SaaS.
- Don’t make the whole site a physics demo (no docks, fans, carousels as chrome).
- Don’t use identical icon+title card grids as the hero story.
- Don’t default AI rewrite of whole drafts; UI must reinforce independent attempt first.
- Don’t use washed gray body text on cream; push muted toward ink/warm brown.
