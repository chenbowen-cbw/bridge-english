import { useNavigate } from 'react-router-dom'
import { WeeklyReviewPanel } from '../../features/reviews'

export function ReviewPage() {
  const navigate = useNavigate()

  return (
    <div className="wrap app-panel">
      <WeeklyReviewPanel
        onNeedAuth={() => navigate('/login?next=' + encodeURIComponent('/app/review'))}
      />
    </div>
  )
}
