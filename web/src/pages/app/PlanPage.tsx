import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { BridgeButton } from '../../components/BridgeButton'
import { useAuth } from '../../features/auth'
import {
  CurrentPlanView,
  getActivePlan,
  getPlanById,
  listArchivedPlans,
  PlanWizard,
} from '../../features/plans'
import type { LearningPlanRow } from '../../features/plans/api'

export function PlanPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const seedGoal = params.get('goal') ?? ''
  const historyId = params.get('id')
  const [active, setActive] = useState<LearningPlanRow | null>(null)
  const [archived, setArchived] = useState<LearningPlanRow[]>([])
  const [historyPlan, setHistoryPlan] = useState<LearningPlanRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [adjusting, setAdjusting] = useState(false)
  const [loadKey, setLoadKey] = useState(0)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    const [activeRes, archivedRes] = await Promise.all([
      getActivePlan(user.id),
      listArchivedPlans(user.id),
    ])
    if (!activeRes.ok) {
      setError(activeRes.error)
      setActive(null)
      setLoading(false)
      return
    }
    setActive(activeRes.plan)
    setArchived(archivedRes.ok ? archivedRes.plans : [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    void load()
  }, [load, loadKey])

  useEffect(() => {
    if (!user || !historyId) {
      setHistoryPlan(null)
      return
    }
    const cached =
      archived.find((p) => p.id === historyId) ?? (active?.id === historyId ? active : null)
    if (cached) {
      setHistoryPlan(cached)
      return
    }
    let cancelled = false
    void getPlanById(user.id, historyId).then((res) => {
      if (cancelled) return
      setHistoryPlan(res.ok ? res.plan : null)
    })
    return () => {
      cancelled = true
    }
  }, [user, historyId, archived, active])

  function openHistory(id: string) {
    const next = new URLSearchParams(params)
    next.delete('goal')
    next.set('id', id)
    setParams(next, { replace: true })
    setAdjusting(false)
  }

  function clearHistory() {
    const next = new URLSearchParams(params)
    next.delete('id')
    setParams(next, { replace: true })
    setHistoryPlan(null)
  }

  function startTask(templateId: string | null) {
    navigate(
      templateId
        ? `/app/footprints?template=${encodeURIComponent(templateId)}`
        : '/app/footprints',
    )
  }

  if (loading) {
    return (
      <div className="wrap app-panel">
        <p className="app-loading" role="status">
          读取当前计划…
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="wrap app-panel app-panel--tight">
        <h2>计划暂时读不出来</h2>
        <p className="app-lead">{error}</p>
        <BridgeButton variant="primary" onClick={() => setLoadKey((n) => n + 1)}>
          重试
        </BridgeButton>
      </div>
    )
  }

  if (historyId && historyPlan && historyPlan.status !== 'active') {
    return (
      <div className="wrap app-panel app-panel--tight">
        <CurrentPlanView plan={historyPlan} readonly onBack={clearHistory} />
      </div>
    )
  }

  if (historyId && !historyPlan) {
    return (
      <div className="wrap app-panel app-panel--tight">
        <h2>找不到这份历史计划</h2>
        <p className="app-lead">可能已经不在本子里了。</p>
        <BridgeButton variant="ghost" arrow="none" onClick={clearHistory}>
          回到当前计划
        </BridgeButton>
      </div>
    )
  }

  if (adjusting || !active) {
    return (
      <div className="wrap app-panel app-panel--tight">
        <PlanWizard
          key={`${seedGoal}:${adjusting ? 'adjust' : 'new'}`}
          seedGoal={seedGoal}
          onCancel={active ? () => setAdjusting(false) : undefined}
          onNeedAuth={() =>
            navigate(
              '/login?next=' +
                encodeURIComponent(`/app/plan${seedGoal ? `?goal=${encodeURIComponent(seedGoal)}` : ''}`),
            )
          }
          onStartFirstTask={(templateId) =>
            navigate(`/app/footprints?template=${encodeURIComponent(templateId)}`)
          }
        />
      </div>
    )
  }

  return (
    <div className="wrap app-panel app-panel--tight">
      <CurrentPlanView
        plan={active}
        history={archived}
        onAdjust={() => setAdjusting(true)}
        onStartTask={startTask}
        onOpenHistory={openHistory}
      />
    </div>
  )
}
