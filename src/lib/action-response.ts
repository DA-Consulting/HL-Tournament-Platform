/**
 * Contrato tipado unificado para respuestas de Server Actions en la aplicación.
 */
export type ActionResponse<T = unknown> =
  | { success: true; message: string; data?: T }
  | { success: false; message: string; code?: string }

export interface SupabaseLikeError {
  message?: string
  code?: string
  details?: string
  hint?: string
  status?: number
}

/**
 * Inspecciona los códigos de error de PostgreSQL, PostgREST y Supabase Auth
 * para transformar fallos técnicos en mensajes comprensibles y amigables en español,
 * sin filtrar detalles internos o trazas de la base de datos al cliente.
 */
export function formatSupabaseErrorMessage(error: unknown): { message: string; code: string } {
  if (!error) {
    return {
      message: 'Ocurrió un error inesperado al procesar la solicitud.',
      code: 'UNKNOWN_ERROR',
    }
  }

  const err = error as SupabaseLikeError
  const code = err.code || 'UNKNOWN_ERROR'
  const rawMsg = (err.message || '').toLowerCase()

  // 1. Códigos estándar de PostgreSQL
  switch (code) {
    case '23505': // unique_violation
      if (rawMsg.includes('steam_id')) {
        return {
          message: 'El Steam ID ingresado ya se encuentra vinculado a otro jugador en el sistema.',
          code,
        }
      }
      if (rawMsg.includes('email') || rawMsg.includes('profiles_email')) {
        return {
          message: 'Ya existe una cuenta registrada con este correo electrónico.',
          code,
        }
      }
      if (rawMsg.includes('clans_name') || rawMsg.includes('name')) {
        return {
          message: 'Ya existe un registro con este nombre. Por favor, elige un nombre diferente.',
          code,
        }
      }
      return {
        message: 'No se pudo guardar: el registro contiene datos que ya existen en el sistema.',
        code,
      }

    case '23503': // foreign_key_violation
      return {
        message: 'No se encontró la entidad relacionada requerida (clan, jugador u organizador inexistente).',
        code,
      }

    case '23502': // not_null_violation
      return {
        message: 'Faltan campos obligatorios para completar la operación.',
        code,
      }

    case '42501': // insufficient_privilege (violación de políticas RLS)
      return {
        message: 'Permiso denegado: no tienes autorización para modificar o acceder a este recurso.',
        code,
      }

    case '22P02': // invalid_text_representation (UUID malformado o tipo de dato inválido)
      return {
        message: 'El identificador o formato proporcionado no es válido.',
        code,
      }

    case '42P01': // undefined_table
      return {
        message: 'Error interno: recurso no disponible temporalmente en el servidor.',
        code,
      }

    // 2. Códigos estándar de PostgREST
    case 'PGRST116': // The result contains 0 rows (single record not found)
      return {
        message: 'No se encontró el registro solicitado o no está disponible.',
        code,
      }

    case 'PGRST301': // JWT expired / token inválido
      return {
        message: 'Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.',
        code,
      }

    case 'PGRST204': // Column not found
      return {
        message: 'Error de compatibilidad con los campos de la solicitud.',
        code,
      }
  }

  // 3. Errores comunes de Supabase Auth por mensaje
  if (rawMsg.includes('invalid login credentials') || rawMsg.includes('invalid credentials')) {
    return {
      message: 'Correo electrónico o contraseña incorrectos. Verifica tus credenciales.',
      code: 'AUTH_INVALID_CREDENTIALS',
    }
  }

  if (rawMsg.includes('user already registered') || rawMsg.includes('already exists')) {
    return {
      message: 'Ya existe una cuenta registrada con este correo electrónico.',
      code: 'AUTH_USER_EXISTS',
    }
  }

  if (rawMsg.includes('password should be at least')) {
    return {
      message: 'La contraseña de seguridad debe contener al menos 6 caracteres.',
      code: 'AUTH_WEAK_PASSWORD',
    }
  }

  if (rawMsg.includes('email not confirmed')) {
    return {
      message: 'Debes confirmar tu correo electrónico para poder acceder.',
      code: 'AUTH_EMAIL_UNCONFIRMED',
    }
  }

  if (rawMsg.includes('rate limit') || rawMsg.includes('too many requests')) {
    return {
      message: 'Demasiadas solicitudes en poco tiempo. Por favor, espera un momento antes de reintentar.',
      code: 'AUTH_RATE_LIMIT',
    }
  }

  // 4. Errores de red o conexión
  if (rawMsg.includes('fetch failed') || rawMsg.includes('network') || rawMsg.includes('connection')) {
    return {
      message: 'Error de conexión con el servidor. Revisa tu conexión a internet o reintenta en breve.',
      code: 'NETWORK_ERROR',
    }
  }

  // 5. Fallback seguro: nunca exponer trazas de SQL o código interno al cliente
  return {
    message:
      err.message &&
      !err.message.includes('relation') &&
      !err.message.includes('syntax') &&
      !err.message.includes('column') &&
      !err.message.includes('table')
        ? err.message
        : 'Ocurrió un error al procesar la operación. Inténtalo de nuevo más tarde.',
    code,
  }
}

/**
 * Normaliza un fallo de Supabase o una excepción de servidor en un ActionResponse fallido.
 */
export function handleActionError(error: unknown, fallbackMessage?: string): ActionResponse<never> {
  const { message, code } = formatSupabaseErrorMessage(error)
  return {
    success: false,
    message: fallbackMessage || message,
    code,
  }
}

/**
 * Normaliza un resultado exitoso en un ActionResponse.
 */
export function handleActionSuccess<T>(message: string, data?: T): ActionResponse<T> {
  return {
    success: true,
    message,
    ...(data !== undefined ? { data } : {}),
  }
}
