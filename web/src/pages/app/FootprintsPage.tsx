import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FootprintsPanel, getTemplate, requestTemplate } from '../../features/footprints'

export function FootprintsPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const template = params.get('template')
  const focusId = params.get('id')
  const [queryWarning, setQueryWarning] = useState<string | null>(null)

  const replaceQuery = useCallback(
    (mutate: (next: URLSearchParams) => void) => {
      const next = new URLSearchParams(params)
      mutate(next)
      const search = next.toString()
      navigate({ pathname: '/app/footprints', search: search ? `?${search}` : '' }, { replace: true })
    },
    [navigate, params],
  )

  useEffect(() => {
    if (!template) return
    if (!getTemplate(template)) {
      setQueryWarning('没有这个任务模板，已回到练习页。')
      const next = new URLSearchParams(params)
      next.delete('template')
      const search = next.toString()
      navigate({ pathname: '/app/footprints', search: search ? `?${search}` : '' }, { replace: true })
      return
    }
    requestTemplate(template)
    // apply once per template id; do not re-fire when params object identity changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template])

  const onClearFocus = useCallback(() => {
    replaceQuery((next) => next.delete('id'))
  }, [replaceQuery])

  const onInvalidFocus = useCallback(() => {
    setQueryWarning('找不到这条练习，已取消选中。')
    replaceQuery((next) => next.delete('id'))
  }, [replaceQuery])

  const nextQuery = template
    ? `?template=${encodeURIComponent(template)}`
    : focusId
      ? `?id=${encodeURIComponent(focusId)}`
      : ''

  return (
    <div className="wrap app-panel">
      <FootprintsPanel
        focusId={focusId}
        queryWarning={queryWarning}
        onClearFocus={onClearFocus}
        onInvalidFocus={onInvalidFocus}
        onNeedAuth={() =>
          navigate('/login?next=' + encodeURIComponent(`/app/footprints${nextQuery}`))
        }
      />
    </div>
  )
}
