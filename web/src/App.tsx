import { useState } from 'react'
import { BridgeButton } from './components/BridgeButton'
import { NotebookReveal } from './components/NotebookReveal'
import './App.css'

const STEPS = ['1 计划', '2 任务', '3 陪练', '4 足迹', '5 复盘'] as const

const FOOTPRINT = [
  { n: '01', title: '今日任务', body: '一张旅行点餐卡，约 30 分钟。' },
  { n: '02', title: '先独立试', body: '先写自己的稿，AI 不抢判断。' },
  { n: '03', title: '陪练纠错', body: '讲解 → 练习 → 追问，再独立输出。' },
  { n: '04', title: '留下痕迹', body: '输出嵌在任务结束态，周复盘轻量对比。' },
]

const PLANS = [
  {
    id: 'free',
    badge: '免费',
    name: '草稿本',
    tagline: '先把「计划 → 任务 → 足迹」跑通，不急着付费。',
    priceMonth: '0',
    unitMonth: '元 / 永久',
    noteMonth: '随时可换本，进度保留',
    priceYear: '0',
    unitYear: '元 / 永久',
    noteYear: '随时可换本，进度保留',
    features: [
      '1 个进行中的生活微目标计划',
      '每周 3 张核心场景任务卡',
      '每月 8 次 AI 陪练（先独立稿 · 讲解→练习→追问）',
      '独立输出存足迹（最近 14 天）',
      '轻量周复盘清单',
    ],
    omit: '暂不含语音陪练与毕业任务',
    cta: '开始使用草稿本',
    featured: false,
    quiet: true,
    ghost: true,
  },
  {
    id: 'daily',
    badge: '多数人选',
    name: '日常本',
    tagline: '日常提升的主力本：计划更稳，痕迹留得更全。',
    priceMonth: '58',
    unitMonth: '元 / 月',
    noteMonth: '年付 ¥468 · 约合 ¥39 / 月',
    priceYear: '468',
    unitYear: '元 / 年',
    noteYear: '约合 ¥39 / 月 · 含 4 个月坚持奖励',
    features: [
      '多目标计划切换 · 今日计划提醒',
      '旅行 / 看剧 / 聊天 / 兴趣阅读场景任务卡',
      '每月 40 次 AI 陪练（先独立稿 · 禁整段改写）',
      '足迹完整历史 · 月度前后对比',
      '周复盘：完成 · 质量 · 保持 · 迁移',
      '每月 8 次语音陪练',
    ],
    omit: null,
    cta: '选择日常本',
    featured: true,
    quiet: false,
    ghost: false,
  },
  {
    id: 'deep',
    badge: '深练',
    name: '深练本',
    tagline: '把对比拉长，把场景练回真实生活。',
    priceMonth: '108',
    unitMonth: '元 / 月',
    noteMonth: '年付 ¥888 · 约合 ¥74 / 月',
    priceYear: '888',
    unitYear: '元 / 年',
    noteYear: '约合 ¥74 / 月 · 含 4 个月坚持奖励',
    features: [
      '日常本全部能力',
      '每月 100 次 AI 陪练（边界同上）',
      '语音陪练更宽裕（约 30 次 / 月）',
      '毕业任务：把场景用回真实生活',
      '足迹跨季对比 · 可导出笔记',
    ],
    omit: '同样不做整段代写',
    cta: '选择深练本',
    featured: false,
    quiet: true,
    ghost: true,
  },
] as const

export default function App() {
  const [goal, setGoal] = useState(
    'I want clearer English for travel chats and shows I love — real conversations, not word lists. I have about 30 minutes most evenings.',
  )
  const [billCycle, setBillCycle] = useState<'month' | 'year'>('month')

  return (
    <div className="page">
      <header className="top">
        <div className="wrap nav">
          <a className="wordmark" href="#home">
            bridge.
            <span>ENGLISH</span>
          </a>
          <nav className="links" aria-label="主导航">
            <a className="on" href="#home">
              首页
            </a>
            <a href="#plan">计划</a>
            <a href="#tasks">任务</a>
            <a href="#footprints">足迹</a>
            <a href="#review">复盘</a>
            <a href="#pricing">订阅</a>
          </nav>
          <div className="nav-right">
            <button type="button" className="lang">
              中文
            </button>
            <BridgeButton variant="nav" arrow="none">
              定制计划
            </BridgeButton>
          </div>
        </div>
      </header>

      <main id="home">
        <section className="hero" id="hero-stage">
          <NotebookReveal />
          <div className="hero-inner">
            <p className="kicker">AI 时代的务实英语学习</p>
            <h1>
              这一次，让英语不再停在
              <span className="nw">「开始」</span>
            </h1>
            <p className="lead">
              写下生活里想做成的一件英语小事——我们一起定制计划，而不是又一次空开聊天。
            </p>
            <div className="prompt" id="plan">
              <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                rows={4}
                aria-label="你想做成的英语小事"
              />
              <div className="prompt-actions">
                <button type="button" className="up" title="上传灵感" aria-label="上传灵感">
                  ↑
                </button>
                <BridgeButton variant="hero" arrow="up">
                  定制计划
                </BridgeButton>
              </div>
            </div>
            <div className="steps">
              {STEPS.map((s) => (
                <span key={s}>{s}</span>
              ))}
            </div>
          </div>
        </section>

        <section className="footprint-band" id="footprints">
          <div className="wrap">
            <p className="kicker">足迹 · 不是档案墙</p>
            <h2>一张任务，如何留下痕迹</h2>
            <p className="band-lead">
              足迹嵌在任务结束态：独立输出先存证，再展开 AI 点拨；周复盘只做轻量前后对比。
            </p>
            <ol className="trail">
              {FOOTPRINT.map((item) => (
                <li key={item.n}>
                  <span className="num">{item.n}</span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="band-cta">
              <BridgeButton variant="primary">看今日任务</BridgeButton>
              <BridgeButton variant="ghost" arrow="none">
                定制计划
              </BridgeButton>
            </div>
          </div>
        </section>

        <section className="pricing-band" id="pricing">
          <div className="wrap">
            <div className="pricing-head">
              <h2>选一本陪你日常练英语的本子</h2>
              <p className="band-lead">
                计划、任务卡、陪练边界，再把输出留成足迹。付费换更稳的节奏与更长的对照——卖陪练与痕迹，不卖代写。
              </p>
            </div>
            <div className="bill-toggle" role="group" aria-label="计费周期">
              <button
                type="button"
                className={billCycle === 'month' ? 'on' : undefined}
                onClick={() => setBillCycle('month')}
              >
                按月
              </button>
              <button
                type="button"
                className={billCycle === 'year' ? 'on' : undefined}
                onClick={() => setBillCycle('year')}
              >
                按年 · 坚持奖励
              </button>
            </div>
            <p className="bill-hint">
              示意价 · CNY。年付按 <strong>8 个月价</strong>，多出来的 4 个月当作坚持奖励。
            </p>
            <div className="plan-spread">
              {PLANS.map((plan) => {
                const price = billCycle === 'year' ? plan.priceYear : plan.priceMonth
                const unit = billCycle === 'year' ? plan.unitYear : plan.unitMonth
                const note = billCycle === 'year' ? plan.noteYear : plan.noteMonth
                const colClass = [
                  'plan-col',
                  plan.featured ? 'featured' : '',
                  plan.quiet ? 'quiet' : '',
                ]
                  .filter(Boolean)
                  .join(' ')
                return (
                  <article key={plan.id} className={colClass}>
                    <span className="plan-badge">{plan.badge}</span>
                    <h3>{plan.name}</h3>
                    <p className="plan-tagline">{plan.tagline}</p>
                    <div className="plan-price">
                      <span className="amt">{price}</span>
                      <span className="unit">{unit}</span>
                    </div>
                    <p className="plan-price-note">{note}</p>
                    <ul className="plan-list">
                      {plan.features.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                      {plan.omit ? <li className="omit">{plan.omit}</li> : null}
                    </ul>
                    <BridgeButton
                      variant={plan.ghost ? 'ghost' : 'primary'}
                      arrow="right"
                    >
                      {plan.cta}
                    </BridgeButton>
                  </article>
                )
              })}
            </div>
            <p className="pricing-note">
              <strong>卖的是：</strong>
              陪练节奏、真实场景任务卡、更长的足迹对照、毕业任务。
              <br />
              <strong>不卖：</strong>
              整段代写、题库冲刺、断签惩罚。
            </p>
            <div className="pricing-hooks">
              <div className="hook">
                <h4>什么时候换到日常本</h4>
                <p>
                  本周任务卡或陪练次数用尽，但仍想继续同一目标；或想翻开更多生活场景卡。
                </p>
              </div>
              <div className="hook">
                <h4>什么时候换到深练本</h4>
                <p>
                  语音想练得更勤；想做真实生活毕业任务；或希望足迹能跨季度对照。
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <p className="proto-note">交互原型 v4 · Bridge 纸质编辑风 · 数据为模拟</p>
    </div>
  )
}
