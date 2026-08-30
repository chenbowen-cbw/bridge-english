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
        <p className="app-lead">
          还没登录也没关系。可以先去「练习」写一条草稿，就存在这台电脑上。要定制计划和周末复盘，需要先登录。
        </p>
        <div className="app-actions">
          <BridgeButton
            variant="primary"
            onClick={() => navigate('/login?next=' + encodeURIComponent('/app'))}
          >
            登录
          </BridgeButton>
          <BridgeButton variant="ghost" arrow="none" onClick={() => navigate('/app/footprints')}>
            先去写一条练习
          </BridgeButton>
        </div>
        <p className="band-soft">
          <button type="button" className="app-text-btn" onClick={requestOnboardReplay}>
            再看一遍怎么用
          </button>
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="wrap app-panel">
        <p className="app-loading" role="status">
          正在打开今日的任务…
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
        <h2>今日还没有任务</h2>
        <p className="app-lead">先说清楚你想用英语做成的一件小事，我们帮你排这一周先练什么。</p>
        <BridgeButton variant="primary" onClick={() => navigate('/app/plan')}>
          去定这一周的计划
        </BridgeButton>
        <p className="band-soft">
          <button type="button" className="app-text-btn" onClick={requestOnboardReplay}>
            再看一遍怎么用
          </button>
        </p>
      </div>
    )
  }

  const task = planFirstTask(plan)

  return (
    <div className="wrap app-panel app-panel--tight">
      <h2>今日</h2>
      <p className="app-goal">{plan.goal_sentence ?? '（还没写下想做成的事）'}</p>
      {plan.week_focus ? <p className="app-focus">{plan.week_focus}</p> : null}
      {task.title ? (
        <div className="app-today-card">
          <p className="app-today-label">今天先做这一件</p>
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
            按这张卡去写练习
          </BridgeButton>
        </div>
      ) : (
        <BridgeButton variant="primary" onClick={() => navigate('/app/footprints')}>
          去练习里写
        </BridgeButton>
      )}
      <p className="band-soft">
        <Link to="/app/plan">看正在用的计划</Link>
        {' · '}
        <Link to="/app/review">去做本周复盘</Link>
        {' · '}
        <button type="button" className="app-text-btn" onClick={requestOnboardReplay}>
          再看一遍怎么用
        </button>
      </p>
    </div>
  )
}
