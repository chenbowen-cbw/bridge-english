import { useNavigate, useSearchParams } from 'react-router-dom'
import { AuthPanel } from '../features/auth'
import { resolvePostLoginPath } from '../features/auth/postLoginPath'
import { supabase } from '../lib/supabase'

export function LoginPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = params.get('next')

  return (
    <main className="marketing-page login-page">
      <div className="wrap login-wrap">
        <AuthPanel
          onClose={() => navigate(-1)}
          onSuccess={() => {
            void (async () => {
              const session = supabase
                ? (await supabase.auth.getSession()).data.session
                : null
              if (session?.user.id) {
                const path = await resolvePostLoginPath(session.user.id, next)
                navigate(path, { replace: true })
                return
              }
              if (next && next.startsWith('/') && !next.startsWith('//')) {
                navigate(next, { replace: true })
                return
              }
              navigate('/app', { replace: true })
            })()
          }}
        />
      </div>
    </main>
  )
}
