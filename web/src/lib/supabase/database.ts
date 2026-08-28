/**
 * Hand-maintained Database shape (supabase CLI unavailable on win32 here).
 * Prefer regenerating with: npx supabase gen types typescript --project-id ncmmwaehjeqcjgxavwjw
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          user_id: string
          display_name: string | null
          plan_tier: 'free' | 'daily' | 'deep'
          plan_focus: Json | null
          locale: string
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          display_name?: string | null
          plan_tier?: 'free' | 'daily' | 'deep'
          plan_focus?: Json | null
          locale?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          display_name?: string | null
          plan_focus?: Json | null
          locale?: string
          updated_at?: string
          /** Clients cannot update plan_tier (column grants + trigger). */
          plan_tier?: never
        }
        Relationships: []
      }
      learning_plans: {
        Row: {
          id: string
          user_id: string
          status: string
          questionnaire: Json
          goal_sentence: string | null
          week_focus: string | null
          retest_at: string | null
          tasks_progress: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          status?: string
          questionnaire?: Json
          goal_sentence?: string | null
          week_focus?: string | null
          retest_at?: string | null
          tasks_progress?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          status?: string
          questionnaire?: Json
          goal_sentence?: string | null
          week_focus?: string | null
          retest_at?: string | null
          tasks_progress?: Json
          updated_at?: string
        }
        Relationships: []
      }
      footprints: {
        Row: {
          id: string
          user_id: string
          plan_id: string | null
          client_id: string | null
          scene: string
          title: string
          body: string
          criteria_met: boolean
          self_rating: string | null
          migrated: boolean
          mode: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_id?: string | null
          client_id?: string | null
          scene: string
          title: string
          body: string
          criteria_met?: boolean
          self_rating?: string | null
          migrated?: boolean
          mode?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          plan_id?: string | null
          scene?: string
          title?: string
          body?: string
          criteria_met?: boolean
          self_rating?: string | null
          migrated?: boolean
          mode?: string
          updated_at?: string
        }
        Relationships: []
      }
      weekly_reviews: {
        Row: {
          id: string
          user_id: string
          week_key: string
          answers: Json
          focus_next: string | null
          footprint_ids: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          week_key: string
          answers?: Json
          focus_next?: string | null
          footprint_ids?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          answers?: Json
          focus_next?: string | null
          footprint_ids?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      ai_coach_daily: {
        Row: {
          user_id: string
          day: string
          count: number
        }
        Insert: {
          user_id: string
          day?: string
          count?: number
        }
        Update: {
          count?: number
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      bump_ai_coach_daily: {
        Args: { p_limit?: number }
        Returns: Json
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
