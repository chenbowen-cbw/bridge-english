import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BridgeButton } from '../../components/BridgeButton'
import { useAuth } from '../../features/auth'
import { getActivePlan, type LearningPlanRow } from '../../features/plans/api'

export function TodayPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [plan, setPlan] = useState<LearningPlanRow | null>(null)
  const [loading, setLoading] = useState(!!user)

  useEffect(() => {
    if (!user) {
      setPlan(null)
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    void getActivePlan(user.id).then((p) => {
      if (!cancelled) {
        setPlan(p)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [user?.id])

  if (!user) {
    return (
      <div className="wrap app-panel">
        <p className="kicker">今日</p>
        <h2>先登录，再打开今日任务</h2>
        <p className="app-lead">
          未登录可先到足迹页浅试一条本机草稿。完整计划与周复盘需要账号。
        </p>
        <div className="app-actions">
          <BridgeButton
            variant="primary"
            onClick={() => navigate('/login?next=' + encodeURIComponent('/app'))}
          >
            登录
          </BridgeButton>
          <BridgeButton variant="ghost" arrow="none" onClick={() => navigate('/app/footprints')}>
            浅试足迹
          </BridgeButton>
        </div>
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

  if (!plan) {
    return (
      <div className="wrap app-panel">
        <p className="kicker">今日</p>
        <h2>还没有进行中的计划</h2>
        <p className="app-lead">描述一件生活里的英语小事，三分钟定制本周练法。</p>
        <BridgeButton variant="primary" onClick={() => navigate('/app/plan')}>
          去定制计划
        </BridgeButton>
      </div>
    )
  }

  const firstTitle =
    typeof plan.tasks_progress?.firstTaskTitle === 'string'
      ? plan.tasks_progress.firstTaskTitle
      : null
  const firstTemplate =
    typeof plan.tasks_progress?.firstTemplateId === 'string'
      ? plan.tasks_progress.firstTemplateId
      : null

  return (
    <div className="wrap app-panel">
      <p className="kicker">今日</p>
      <h2>这一周的焦点</h2>
      <p className="app-goal">{plan.goal_sentence ?? '（未写目标句）'}</p>
      {plan.week_focus ? <p className="app-focus">{plan.week_focus}</p> : null}
      {firstTitle ? (
        <div className="app-today-card">
          <p className="app-today-label">本周第一张任务</p>
          <p className="app-today-title">{firstTitle}</p>
          <BridgeButton
            variant="primary"
            onClick={() =>
              navigate(
                firstTemplate
                  ? `/app/footprints?template=${encodeURIComponent(firstTemplate)}`
                  : '/app/footprints',
              )
            }
          >
            去写足迹
          </BridgeButton>
        </div>
      ) : (
        <BridgeButton variant="primary" onClick={() => navigate('/app/footprints')}>
          打开足迹
        </BridgeButton>
      )}
      <p className="band-soft">
        <Link to="/app/plan">改计划</Link>
        {' · '}
        <Link to="/app/review">本周复盘</Link>
      </p>
    </div>
  )
}
