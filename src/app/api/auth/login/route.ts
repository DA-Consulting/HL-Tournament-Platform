import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAuthService } from '@/services/auth.service'
import type { SignInCredentials } from '@/types/auth.types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const authService = createAuthService(supabase)
    const body = (await request.json()) as SignInCredentials

    if (!body.email || !body.password) {
      return NextResponse.json(
        { error: 'Email y contraseña son obligatorios' },
        { status: 400 }
      )
    }

    const result = await authService.signInWithPassword({
      email: body.email,
      password: body.password,
    })

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 401 })
    }

    return NextResponse.json({ data: result.data }, { status: 200 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al iniciar sesión'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
