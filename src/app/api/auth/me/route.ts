import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAuthService } from '@/services/auth.service'

export async function GET() {
  try {
    const supabase = await createClient()
    const authService = createAuthService(supabase)

    const userRes = await authService.getUser()

    if (userRes.error || !userRes.data) {
      return NextResponse.json({ user: null, profile: null }, { status: 200 })
    }

    const profileRes = await authService.getProfile(userRes.data.id)

    return NextResponse.json(
      {
        user: {
          id: userRes.data.id,
          email: userRes.data.email,
          createdAt: userRes.data.created_at,
        },
        profile: profileRes.data,
      },
      { status: 200 }
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al verificar sesión'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
