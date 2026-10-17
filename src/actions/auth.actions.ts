'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  type ActionResponse,
  handleActionError,
  handleActionSuccess,
} from '@/lib/action-response'
import type { SignInCredentials, SignUpCredentials } from '@/types/auth.types'

/**
 * Server Action para iniciar sesión con correo y contraseña.
 */
export async function loginAction(
  credentials: SignInCredentials
): Promise<ActionResponse<{ userId: string; email: string }>> {
  try {
    const { email, password } = credentials

    if (!email?.trim() || !password) {
      return {
        success: false,
        message: 'Por favor, ingresa tu correo electrónico y contraseña.',
        code: 'VALIDATION_ERROR',
      }
    }

    const supabase = await createClient()

    // En Supabase CRUD/Auth no se lanza throw, se evalúa { data, error }
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })

    if (error) {
      return handleActionError(error)
    }

    if (!data.user) {
      return {
        success: false,
        message: 'No se pudo obtener la información del usuario.',
        code: 'USER_NOT_FOUND',
      }
    }

    revalidatePath('/', 'layout')

    const displayName =
      data.user.user_metadata?.display_name ||
      data.user.email?.split('@')[0] ||
      'Combatiente'

    return handleActionSuccess(`¡Bienvenido de vuelta, ${displayName}!`, {
      userId: data.user.id,
      email: data.user.email || email,
    })
  } catch (criticalError: unknown) {
    // try/catch reservado únicamente para excepciones críticas no controladas
    console.error('[CRITICAL loginAction error]:', criticalError)
    return {
      success: false,
      message: 'Ocurrió un error inesperado al conectar con el servidor de autenticación.',
      code: 'SERVER_EXCEPTION',
    }
  }
}

/**
 * Server Action para registrar un nuevo usuario y su perfil.
 */
export async function registerAction(
  credentials: SignUpCredentials
): Promise<ActionResponse<{ userId: string; email: string }>> {
  try {
    const { email, password, displayName } = credentials

    if (!email?.trim() || !password) {
      return {
        success: false,
        message: 'El correo electrónico y la contraseña son obligatorios.',
        code: 'VALIDATION_ERROR',
      }
    }

    if (password.length < 6) {
      return {
        success: false,
        message: 'La contraseña de seguridad debe contener al menos 6 caracteres.',
        code: 'WEAK_PASSWORD',
      }
    }

    const supabase = await createClient()

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          display_name: displayName?.trim() || email.split('@')[0],
          role: 'player',
        },
      },
    })

    if (error) {
      return handleActionError(error)
    }

    if (!data.user) {
      return {
        success: false,
        message: 'No se pudo registrar el usuario en el sistema.',
        code: 'REGISTRATION_FAILED',
      }
    }

    revalidatePath('/', 'layout')

    return handleActionSuccess(
      '¡Cuenta creada exitosamente! Tu perfil y jugador han sido registrados.',
      {
        userId: data.user.id,
        email: data.user.email || email,
      }
    )
  } catch (criticalError: unknown) {
    console.error('[CRITICAL registerAction error]:', criticalError)
    return {
      success: false,
      message: 'Ocurrió un fallo crítico en el servidor durante el registro.',
      code: 'SERVER_EXCEPTION',
    }
  }
}

/**
 * Server Action para cerrar sesión de forma segura y revocar cookies.
 */
export async function logoutAction(): Promise<ActionResponse<boolean>> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      return handleActionError(error)
    }

    revalidatePath('/', 'layout')
    return handleActionSuccess('Has cerrado sesión correctamente.', true)
  } catch (criticalError: unknown) {
    console.error('[CRITICAL logoutAction error]:', criticalError)
    return {
      success: false,
      message: 'Ocurrió un error al cerrar la sesión en el servidor.',
      code: 'SERVER_EXCEPTION',
    }
  }
}
