import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createTournamentsService } from '@/services/tournaments.service'
import type { TournamentUpdate } from '@/types/models'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    const tournamentsService = createTournamentsService(supabase)

    const result = await tournamentsService.getTournamentById(id)
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
    const tournamentsService = createTournamentsService(supabase)
    const body = (await request.json()) as TournamentUpdate

    const result = await tournamentsService.updateTournament(id, body)
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ data: result.data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al actualizar el torneo'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    const tournamentsService = createTournamentsService(supabase)

    const result = await tournamentsService.deleteTournament(id)
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al eliminar el torneo'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
