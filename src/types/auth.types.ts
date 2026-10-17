import type { User, Session } from '@supabase/supabase-js'
import type { Profile } from './models'

export interface SignUpCredentials {
  email: string
  password: string
  displayName?: string
  metadata?: Record<string, unknown>
}

export interface SignInCredentials {
  email: string
  password: string
}

export interface ResetPasswordParams {
  email: string
  redirectTo?: string
}

export interface UpdatePasswordParams {
  newPassword: string
}

export interface UpdateProfileParams {
  displayName?: string
  avatarUrl?: string
}

export interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
}

export interface AuthResponse<T> {
  data: T | null
  error: string | null
}
