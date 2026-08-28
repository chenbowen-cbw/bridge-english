# Bridge English

AI 时代务实英语学习站 — 纸质笔记本编辑风。

## 本地预览

**完整交互原型（推荐先看按钮与文案）**

```bash
# 任意静态服务器；或直接用浏览器打开根目录 index.html
npx --yes serve .
# → 打开提示的本地地址，查看 index.html
```

**Vite React 首页（Amicro 磁吸按钮组件）**

需 Node ≥ 18（本机可用 `nvm use 22`）：

```bash
cd web
npm install
npm run dev
```

## Amicro

- 已安装依赖：`@subhanhq/amicro`、`motion`（在 `web/`）
- CLI `npx @subhanhq/amicro add physics-dock` 当前包无可用 bin / registry 无 `physics-dock` 条目，故改为：
  - 从 Amicro registry **手写移植** `magnetic-button` → `web/src/components/amicro/magnetic-button.tsx`
  - Bridge 封装 `BridgeButton`（磁吸 + 扫光 + 箭头微移 + press）
- 根目录 `index.html` 原型用原生 JS 实现同等交互气质，并遵守 `prefers-reduced-motion`

## 设计文档

- `PRODUCT.md` — 战略 / IA / 受众
- `DESIGN.md` — tokens、按钮规格、反模式
