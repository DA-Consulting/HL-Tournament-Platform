import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPlayersService } from '@/services/players.service'
import type { PlayerInsert } from '@/types/models'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const playersService = createPlayersService(supabase)

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || undefined
    const steamId = searchParams.get('steamId') || undefined
    const userId = searchParams.get('userId') || undefined
    const clanId = searchParams.get('clanId') || undefined
    const unassignedOnly = searchParams.get('unassignedOnly') === 'true'
    const withClan = searchParams.get('withClan') === 'true'
    const limit = searchParams.has('limit') ? Number(searchParams.get('limit')) : undefined
    const offset = searchParams.has('offset') ? Number(searchParams.get('offset')) : undefined

    if (userId) {
      const result = await playersService.getPlayerByUserId(userId)
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }
      return NextResponse.json({ data: result.data })
    }

    if (steamId) {
      const result = await playersService.getPlayerBySteamId(steamId)
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }
      return NextResponse.json({ data: result.data })
    }

    if (withClan) {
      const result = await playersService.getPlayersWithClan({
        search,
        clanId,
        userId,
        limit,
        offset,
      })
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }
      return NextResponse.json({ data: result.data, count: result.count })
    }

    const result = await playersService.getPlayers({
      search,
      clanId,
      userId,
      unassignedOnly,
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
    const playersService = createPlayersService(supabase)
    const body = (await request.json()) as PlayerInsert

    if (!body.name) {
      return NextResponse.json(
        { error: 'El campo name es obligatorio' },
        { status: 400 }
      )
    }

    const result = await playersService.createPlayer(body)

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ data: result.data }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al registrar jugador'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
