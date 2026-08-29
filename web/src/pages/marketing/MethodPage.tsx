import { Link, useNavigate } from 'react-router-dom'
import { BridgeButton } from '../../components/BridgeButton'
import { METHOD_TRAIL, STEPS } from '../../content/marketing'
import { useAuth } from '../../features/auth'

export function MethodPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <main className="marketing-page">
      <section className="footprint-band method-page" id="method">
        <div className="wrap">
          <p className="kicker">方法</p>
          <h2>真实任务 · 先独立稿 · AI 只点拨</h2>
          <p className="band-lead">
            Bridge 不是词表 App，也不是整段代写。主旅程固定为：计划定制 → 今日任务 → 先独立尝试 →
            AI 陪练 → 独立输出存足迹 → 周复盘。
          </p>
          <div className="steps method-steps">
            {STEPS.map((s) => (
              <span key={s}>{s}</span>
            ))}
          </div>
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
          <div className="method-static" aria-hidden="true">
            <div className="method-card">
              <p className="method-card-kicker">示意 · 任务卡</p>
              <p className="method-card-title">旅行点餐 · 约 30 分钟</p>
              <p className="method-card-body">先写自己的点餐稿，再开陪练。AI 不抢终稿。</p>
            </div>
            <div className="method-card method-card--muted">
              <p className="method-card-kicker">示意 · 足迹</p>
              <p className="method-card-title">独立输出留在本页</p>
              <p className="method-card-body">周复盘只做轻量前后对照，不做分数羞辱。</p>
            </div>
          </div>
          <div className="band-cta">
            <BridgeButton
              variant="primary"
              onClick={() => {
                if (user) navigate('/app/plan')
                else navigate('/login?next=' + encodeURIComponent('/app/plan'))
              }}
            >
              去定制计划
            </BridgeButton>
            <BridgeButton variant="ghost" arrow="none" onClick={() => navigate('/pricing')}>
              看定价
            </BridgeButton>
          </div>
          <p className="band-soft">
            产品面板在 <Link to="/app">/app</Link>；本页仅为静态方法叙事，不含真实问卷或 CRUD。
          </p>
        </div>
      </section>
    </main>
  )
}
