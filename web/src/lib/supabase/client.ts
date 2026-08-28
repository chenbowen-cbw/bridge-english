import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Prefer Vercel / local `VITE_*` env. Fallback is the linked project's
 * public anon credentials (safe in browser; RLS enforces access).
 * Never put service_role or DeepSeek keys here.
 */
const FALLBACK_URL = 'https://ncmmwaehjeqcjgxavwjw.supabase.co'
const FALLBACK_ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jbW13YWVoamVxY2pneGF2d2p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4ODU2ODYsImV4cCI6MjA4OTQ2MTY4Nn0.SfOgTp9JvX7L_32Jb8UB7sTiQAuNOTBg0ePVjzgifOc'

const envUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const envAnon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

const url =
  envUrl && !envUrl.includes('YOUR_PROJECT_REF') ? envUrl : FALLBACK_URL
const anonKey =
  envAnon && envAnon !== 'your_anon_or_publishable_key' ? envAnon : FALLBACK_ANON

export const isSupabaseConfigured = Boolean(url && anonKey)

/** Browser client — anon key only. Never import service_role here. */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null
