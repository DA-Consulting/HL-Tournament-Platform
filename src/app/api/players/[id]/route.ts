import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPlayersService } from '@/services/players.service'
import type { PlayerUpdate } from '@/types/models'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    const playersService = createPlayersService(supabase)

    const withClan = request.nextUrl.searchParams.get('withClan') === 'true'

    if (withClan) {
      const result = await playersService.getPlayerWithClanById(id)
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 404 })
      }
      return NextResponse.json({ data: result.data })
    }

    const result = await playersService.getPlayerById(id)
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
    const playersService = createPlayersService(supabase)
    const body = (await request.json()) as PlayerUpdate

    const result = await playersService.updatePlayer(id, body)
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ data: result.data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al actualizar el jugador'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    const playersService = createPlayersService(supabase)

    const result = await playersService.deletePlayer(id)
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al eliminar el jugador'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
