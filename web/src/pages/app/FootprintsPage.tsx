import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FootprintsPanel, requestTemplate } from '../../features/footprints'

export function FootprintsPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const template = params.get('template')

  useEffect(() => {
    if (template) requestTemplate(template)
  }, [template])

  return (
    <div className="wrap app-panel">
      <FootprintsPanel
        onNeedAuth={() =>
          navigate(
            '/login?next=' +
              encodeURIComponent(
                `/app/footprints${template ? `?template=${encodeURIComponent(template)}` : ''}`,
              ),
          )
        }
      />
    </div>
  )
}
