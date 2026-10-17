import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAuthService } from '@/services/auth.service'
import type { SignUpCredentials } from '@/types/auth.types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const authService = createAuthService(supabase)
    const body = (await request.json()) as SignUpCredentials

    if (!body.email || !body.password) {
      return NextResponse.json(
        { error: 'Email y contraseña son obligatorios' },
        { status: 400 }
      )
    }

    if (body.password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      )
    }

    const result = await authService.signUp({
      email: body.email,
      password: body.password,
      displayName: body.displayName,
      metadata: body.metadata,
    })

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ data: result.data }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al registrar usuario'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
