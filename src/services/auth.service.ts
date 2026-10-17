import type {
  SupabaseClient,
  User,
  Session,
  AuthChangeEvent,
  Subscription,
} from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import type {
  SignUpCredentials,
  SignInCredentials,
  ResetPasswordParams,
  UpdatePasswordParams,
  UpdateProfileParams,
  AuthResponse,
} from '@/types/auth.types'
import type { Profile } from '@/types/models'
import { getBrowserClient } from '@/lib/supabase/client'

export class AuthService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Registra un nuevo usuario con correo y contraseña.
   * Supabase creará el registro en auth.users y el trigger SQL creará su fila en public.profiles.
   */
  async signUp(credentials: SignUpCredentials): Promise<AuthResponse<{ user: User | null; session: Session | null }>> {
    try {
      const { email, password, displayName, metadata } = credentials

      const { data, error } = await this.supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            display_name: displayName?.trim() || null,
            ...metadata,
          },
        },
      })

      if (error) {
        return { data: null, error: error.message }
      }

      return {
        data: {
          user: data.user,
          session: data.session,
        },
        error: null,
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al registrar usuario'
      return { data: null, error: message }
    }
  }

  /**
   * Inicia sesión con correo electrónico y contraseña.
   */
  async signInWithPassword(
    credentials: SignInCredentials
  ): Promise<AuthResponse<{ user: User; session: Session }>> {
    try {
      const { email, password } = credentials

      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })

      if (error) {
        return { data: null, error: error.message }
      }

      if (!data.user || !data.session) {
        return { data: null, error: 'No se pudo obtener la sesión del usuario' }
      }

      return {
        data: {
          user: data.user,
          session: data.session,
        },
        error: null,
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al iniciar sesión'
      return { data: null, error: message }
    }
  }

  /**
   * Cierra la sesión activa del usuario y revoca las cookies de autenticación.
   */
  async signOut(): Promise<AuthResponse<boolean>> {
    try {
      const { error } = await this.supabase.auth.signOut()

      if (error) {
        return { data: null, error: error.message }
      }

      return { data: true, error: null }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cerrar sesión'
      return { data: null, error: message }
    }
  }

  /**
   * Obtiene el usuario autenticado actual desde el servidor o cliente.
   * Valida el token con el backend de Supabase.
   */
  async getUser(): Promise<AuthResponse<User>> {
    try {
      const {
        data: { user },
        error,
      } = await this.supabase.auth.getUser()

      if (error) {
        return { data: null, error: error.message }
      }

      if (!user) {
        return { data: null, error: 'No hay usuario autenticado' }
      }

      return { data: user, error: null }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al verificar usuario'
      return { data: null, error: message }
    }
  }

  /**
   * Obtiene la sesión activa actual (incluyendo JWT y refresh token).
   */
  async getSession(): Promise<AuthResponse<Session>> {
    try {
      const {
        data: { session },
        error,
      } = await this.supabase.auth.getSession()

      if (error) {
        return { data: null, error: error.message }
      }

      if (!session) {
        return { data: null, error: 'No hay sesión activa' }
      }

      return { data: session, error: null }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al obtener sesión'
      return { data: null, error: message }
    }
  }

  /**
   * Obtiene el perfil público del usuario desde la tabla public.profiles.
   * Si no se especifica userId, consulta el del usuario actualmente autenticado.
   */
  async getProfile(userId?: string): Promise<AuthResponse<Profile>> {
    try {
      let targetId = userId

      if (!targetId) {
        const { data: userRes } = await this.getUser()
        if (!userRes) {
          return { data: null, error: 'Usuario no autenticado' }
        }
        targetId = userRes.id
      }

      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', targetId)
        .single()

      if (error) {
        return { data: null, error: error.message }
      }

      return { data: data as Profile, error: null }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al consultar perfil'
      return { data: null, error: message }
    }
  }

  /**
   * Actualiza el perfil público del usuario actual en public.profiles
   * y sincroniza su display_name en los metadatos de auth.users.
   */
  async updateProfile(params: UpdateProfileParams): Promise<AuthResponse<Profile>> {
    try {
      const { data: userRes, error: userErr } = await this.getUser()
      if (userErr || !userRes) {
        return { data: null, error: userErr || 'Usuario no autenticado' }
      }

      const updates: { display_name?: string; avatar_url?: string } = {}
      if (params.displayName !== undefined) updates.display_name = params.displayName
      if (params.avatarUrl !== undefined) updates.avatar_url = params.avatarUrl

      const { data, error } = await this.supabase
        .from('profiles')
        .update(updates)
        .eq('id', userRes.id)
        .select()
        .single()

      if (error) {
        return { data: null, error: error.message }
      }

      if (params.displayName !== undefined) {
        await this.supabase.auth.updateUser({
          data: { display_name: params.displayName },
        })
      }

      return { data: data as Profile, error: null }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al actualizar perfil'
      return { data: null, error: message }
    }
  }

  /**
   * Envía un correo electrónico para recuperar o restablecer la contraseña.
   */
  async resetPasswordForEmail(params: ResetPasswordParams): Promise<AuthResponse<boolean>> {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(params.email.trim(), {
        redirectTo: params.redirectTo,
      })

      if (error) {
        return { data: null, error: error.message }
      }

      return { data: true, error: null }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al solicitar recuperación'
      return { data: null, error: message }
    }
  }

  /**
   * Actualiza la contraseña del usuario actualmente autenticado.
   */
  async updatePassword(params: UpdatePasswordParams): Promise<AuthResponse<User>> {
    try {
      const { data, error } = await this.supabase.auth.updateUser({
        password: params.newPassword,
      })

      if (error) {
        return { data: null, error: error.message }
      }

      return { data: data.user, error: null }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al actualizar contraseña'
      return { data: null, error: message }
    }
  }

  /**
   * Suscribe a cambios en el estado de autenticación (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, etc.).
   * Solo aplicable en el navegador.
   */
  onAuthStateChange(
    callback: (event: AuthChangeEvent, session: Session | null) => void
  ): { subscription: Subscription } {
    const {
      data: { subscription },
    } = this.supabase.auth.onAuthStateChange(callback)
    return { subscription }
  }
}

/**
 * Función fábrica para instanciar el servicio de autenticación con el cliente apropiado de Supabase.
 */
export function createAuthService(client?: SupabaseClient<Database>): AuthService {
  return new AuthService(client || getBrowserClient())
}
