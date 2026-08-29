import { useNavigate, useSearchParams } from 'react-router-dom'
import { PlanWizard } from '../../features/plans'

export function PlanPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const seedGoal = params.get('goal') ?? ''

  return (
    <div className="wrap app-panel">
      <PlanWizard
        key={seedGoal || 'plan-default'}
        seedGoal={seedGoal}
        onNeedAuth={() =>
          navigate('/login?next=' + encodeURIComponent(`/app/plan${seedGoal ? `?goal=${encodeURIComponent(seedGoal)}` : ''}`))
        }
        onStartFirstTask={(templateId) =>
          navigate(`/app/footprints?template=${encodeURIComponent(templateId)}`)
        }
      />
    </div>
  )
}
