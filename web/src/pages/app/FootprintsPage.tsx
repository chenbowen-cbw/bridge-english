import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FootprintsPanel, requestTemplate } from '../../features/footprints'

export function FootprintsPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const template = params.get('template')
  const focusId = params.get('id')

  useEffect(() => {
    if (template) requestTemplate(template)
  }, [template])

  const nextQuery = template
    ? `?template=${encodeURIComponent(template)}`
    : focusId
      ? `?id=${encodeURIComponent(focusId)}`
      : ''

  return (
    <div className="wrap app-panel">
      <FootprintsPanel
        focusId={focusId}
        onNeedAuth={() =>
          navigate('/login?next=' + encodeURIComponent(`/app/footprints${nextQuery}`))
        }
      />
    </div>
  )
}
