import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAuthService } from '@/services/auth.service'

export async function POST() {
  try {
    const supabase = await createClient()
    const authService = createAuthService(supabase)

    const result = await authService.signOut()

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al cerrar sesión'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
