import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BridgeButton } from '../../components/BridgeButton'
import { useAuth } from '../../features/auth'
import { requestOnboardReplay } from '../../features/onboard'
import { getActivePlan, planFirstTask, type LearningPlanRow } from '../../features/plans/api'

export function TodayPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [plan, setPlan] = useState<LearningPlanRow | null>(null)
  const [loading, setLoading] = useState(!!user)
  const [error, setError] = useState<string | null>(null)
  const [loadKey, setLoadKey] = useState(0)

  useEffect(() => {
    if (!user) {
      setPlan(null)
      setError(null)
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    void getActivePlan(user.id).then((res) => {
      if (cancelled) return
      if (!res.ok) {
        setPlan(null)
        setError(res.error)
        setLoading(false)
        return
      }
      setPlan(res.plan)
      setError(null)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [user?.id, loadKey])

  if (!user) {
    return (
      <div className="wrap app-panel app-panel--tight">
        <h2>今日</h2>
        <p className="app-lead">未登录可先到练习浅试一条草稿。计划和复盘需要账号。</p>
        <div className="app-actions">
          <BridgeButton
            variant="primary"
            onClick={() => navigate('/login?next=' + encodeURIComponent('/app'))}
          >
            登录
          </BridgeButton>
          <BridgeButton variant="ghost" arrow="none" onClick={() => navigate('/app/footprints')}>
            浅试练习
          </BridgeButton>
        </div>
        <p className="band-soft">
          <button type="button" className="app-text-btn" onClick={requestOnboardReplay}>
            再看一遍引导
          </button>
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="wrap app-panel">
        <p className="app-loading" role="status">
          读取今日计划…
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="wrap app-panel app-panel--tight">
        <h2>今日</h2>
        <p className="app-lead">{error}</p>
        <BridgeButton variant="primary" onClick={() => setLoadKey((n) => n + 1)}>
          重试
        </BridgeButton>
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="wrap app-panel app-panel--tight">
        <h2>今日还没有任务卡</h2>
        <p className="app-lead">先定一件生活里的英语小事，再摊开这一周。</p>
        <BridgeButton variant="primary" onClick={() => navigate('/app/plan')}>
          去定制计划
        </BridgeButton>
        <p className="band-soft">
          <button type="button" className="app-text-btn" onClick={requestOnboardReplay}>
            再看一遍引导
          </button>
        </p>
      </div>
    )
  }

  const task = planFirstTask(plan)

  return (
    <div className="wrap app-panel app-panel--tight">
      <h2>今日</h2>
      <p className="app-goal">{plan.goal_sentence ?? '（未写目标句）'}</p>
      {plan.week_focus ? <p className="app-focus">{plan.week_focus}</p> : null}
      {task.title ? (
        <div className="app-today-card">
          <p className="app-today-label">这一张</p>
          <p className="app-today-title">{task.title}</p>
          {task.criteria ? <p className="app-today-stamp">{task.criteria}</p> : null}
          <BridgeButton
            variant="primary"
            onClick={() =>
              navigate(
                task.templateId
                  ? `/app/footprints?template=${encodeURIComponent(task.templateId)}`
                  : '/app/footprints',
              )
            }
          >
            去写练习
          </BridgeButton>
        </div>
      ) : (
        <BridgeButton variant="primary" onClick={() => navigate('/app/footprints')}>
          打开练习
        </BridgeButton>
      )}
      <p className="band-soft">
        <Link to="/app/plan">看当前计划</Link>
        {' · '}
        <Link to="/app/review">本周复盘</Link>
        {' · '}
        <button type="button" className="app-text-btn" onClick={requestOnboardReplay}>
          再看一遍引导
        </button>
      </p>
    </div>
  )
}
