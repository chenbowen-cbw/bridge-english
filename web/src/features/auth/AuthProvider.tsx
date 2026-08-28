import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'
import { migrateLocalFootprintsToCloud } from '../footprints/api'

type AuthResult = {
  error: string | null
  /** Present when Auth returned a session (e.g. email confirm disabled / autoconfirm). */
  session: Session | null
}

type AuthContextValue = {
  configured: boolean
  loading: boolean
  session: Session | null
  user: User | null
  signIn: (email: string, password: string) => Promise<AuthResult>
  signUp: (email: string, password: string, displayName?: string) => Promise<AuthResult>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    let cancelled = false
    void supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return
      setSession(data.session)
      setLoading(false)
      if (data.session?.user.id) {
        void migrateLocalFootprintsToCloud(data.session.user.id)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      if (next?.user.id) {
        void migrateLocalFootprintsToCloud(next.user.id)
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (!supabase) return { error: '未配置 Supabase（请填写 web/.env）', session: null }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null, session: data.session ?? null }
  }, [])

  const signUp = useCallback(
    async (email: string, password: string, displayName?: string): Promise<AuthResult> => {
      if (!supabase) return { error: '未配置 Supabase（请填写 web/.env）', session: null }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: displayName ? { display_name: displayName } : undefined,
        },
      })
      return { error: error?.message ?? null, session: data.session ?? null }
    },
    [],
  )

  const signOut = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signOut()
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      configured: isSupabaseConfigured,
      loading,
      session,
      user: session?.user ?? null,
      signIn,
      signUp,
      signOut,
    }),
    [loading, session, signIn, signUp, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
