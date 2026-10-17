import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

/**
 * Cliente de Supabase para su uso en componentes del lado del cliente ('use client').
 * Gestiona automáticamente el almacenamiento de tokens de sesión en el navegador (cookies).
 * Utiliza NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (con fallback a la variable heredada).
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''

  if (!supabaseUrl || !supabaseKey) {
    console.warn(
      'ADVERTENCIA: Las variables de entorno NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY no están configuradas correctamente.'
    )
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseKey)
}

// Singleton opcional para reutilización en el navegador
let browserClient: ReturnType<typeof createClient> | null = null

export function getBrowserClient() {
  if (typeof window === 'undefined') {
    return createClient()
  }
  if (!browserClient) {
    browserClient = createClient()
  }
  return browserClient
}
