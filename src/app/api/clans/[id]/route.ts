import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClansService } from '@/services/clans.service'
import type { ClanUpdate } from '@/types/models'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    const clansService = createClansService(supabase)

    const withMembers = request.nextUrl.searchParams.get('withMembers') === 'true'

    if (withMembers) {
      const result = await clansService.getClanWithMembers(id)
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 404 })
      }
      return NextResponse.json({ data: result.data })
    }

    const result = await clansService.getClanById(id)
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 404 })
    }

    return NextResponse.json({ data: result.data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error en la petición'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    const clansService = createClansService(supabase)
    const body = (await request.json()) as ClanUpdate

    const result = await clansService.updateClan(id, body)
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ data: result.data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al actualizar el clan'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    const clansService = createClansService(supabase)

    const result = await clansService.deleteClan(id)
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al eliminar el clan'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
