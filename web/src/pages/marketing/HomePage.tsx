import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BridgeButton } from '../../components/BridgeButton'
import { NotebookReveal } from '../../components/NotebookReveal'
import { DEFAULT_GOAL, METHOD_TRAIL, PLAN_SCENE_SEEDS, STEPS } from '../../content/marketing'
import { useAuth } from '../../features/auth'

export function HomePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [goal, setGoal] = useState(DEFAULT_GOAL)

  function goCustomizePlan() {
    const q = goal.trim().slice(0, 200)
    const path = q ? `/app/plan?goal=${encodeURIComponent(q)}` : '/app/plan'
    if (user) navigate(path)
    else navigate(`/login?next=${encodeURIComponent(path)}`)
  }

  return (
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
              <BridgeButton variant="hero" arrow="up" onClick={goCustomizePlan}>
                定制计划
              </BridgeButton>
            </div>
          </div>
          <p className="plan-seeds-label">或从一张日常任务卡练起</p>
          <div className="plan-seeds" role="group" aria-label="推荐日常场景">
            {PLAN_SCENE_SEEDS.map((s) => (
              <button
                key={s.id}
                type="button"
                className="plan-seed"
                onClick={() => navigate(`/app/footprints?template=${encodeURIComponent(s.id)}`)}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="steps">
            {STEPS.map((s) => (
              <span key={s}>{s}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="footprint-band" id="method-teaser">
        <div className="wrap">
          <p className="kicker">练习 · 不是档案墙</p>
          <h2>一张任务，如何留下痕迹</h2>
          <p className="band-lead">
            写完先把你自己的稿留下来，再看 AI 点拨；周末轻轻对照前后，不做成档案墙。
          </p>
          <ol className="trail">
            {METHOD_TRAIL.map((item) => (
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
            <BridgeButton variant="primary" onClick={() => navigate('/method')}>
              看完整方法
            </BridgeButton>
            <BridgeButton
              variant="ghost"
              arrow="none"
              onClick={() => navigate('/app/footprints')}
            >
              先写一条练习看看
            </BridgeButton>
          </div>
          <p className="band-soft">
            完整计划和周末复盘在{' '}
            <Link to={user ? '/app' : '/login?next=%2Fapp'}>工作台</Link>
            ；还没登录也可以在练习页先写一条，就存在这台电脑上。
          </p>
        </div>
      </section>
    </main>
  )
}
