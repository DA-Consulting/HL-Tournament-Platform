import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'

/**
 * Cliente de Supabase para su uso en componentes del lado del servidor (Server Components,
 * Server Actions y Route Handlers en Next.js App Router).
 * Lee y persiste cookies de forma segura en las cabeceras HTTP.
 * Utiliza NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (con fallback a la variable heredada).
 */
export async function createClient() {
  const cookieStore = await cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''

  if (!supabaseUrl || !supabaseKey) {
    console.warn(
      'ADVERTENCIA: Las variables de entorno NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY no están configuradas.'
    )
  }

  return createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // El método `setAll` se llamó desde un Server Component.
          // Esto es normal y puede ignorarse si existe un middleware refrescando la sesión.
        }
      },
    },
  })
}
