import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

/**
 * Cliente con privilegios administrativos (secret key / service_role).
 * ATENCIÓN: Solo debe usarse en entornos de servidor de confianza.
 * NUNCA exponer la clave secret o service_role al navegador ni en variables NEXT_PUBLIC_*.
 * Utiliza SUPABASE_SECRET_KEY (con fallback a la variable heredada SUPABASE_SERVICE_ROLE_KEY).
 */
export function createAdminClient() {
  if (typeof window !== 'undefined') {
    throw new Error('createAdminClient solo puede ejecutarse en el servidor.')
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const secretKey =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    ''

  if (!supabaseUrl || !secretKey) {
    throw new Error(
      'Faltan las variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY para inicializar el cliente administrativo.'
    )
  }

  return createSupabaseClient<Database>(supabaseUrl, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
