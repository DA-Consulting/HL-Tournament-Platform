import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createTournamentsService } from '@/services/tournaments.service'
import type { TournamentInsert } from '@/types/models'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const tournamentsService = createTournamentsService(supabase)

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || undefined
    const status = searchParams.get('status') || undefined
    const tournamentType = searchParams.get('tournamentType') || undefined
    const featured = searchParams.get('featured') === 'true'
    const limit = searchParams.has('limit') ? Number(searchParams.get('limit')) : undefined
    const offset = searchParams.has('offset') ? Number(searchParams.get('offset')) : undefined

    if (featured) {
      const result = await tournamentsService.getFeaturedTournaments(limit || 5)
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }
      return NextResponse.json({ data: result.data, count: result.count })
    }

    const result = await tournamentsService.getTournaments({
      search,
      status,
      tournamentType,
      limit,
      offset,
    })

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ data: result.data, count: result.count })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error en la petición'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const tournamentsService = createTournamentsService(supabase)
    const body = (await request.json()) as TournamentInsert

    if (!body.title || !body.player_id || !body.start_date || !body.tournament_type) {
      return NextResponse.json(
        { error: 'Campos requeridos: title, player_id, start_date y tournament_type son obligatorios' },
        { status: 400 }
      )
    }

    const result = await tournamentsService.createTournament(body)

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ data: result.data }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al registrar torneo'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
