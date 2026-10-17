import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClansService } from '@/services/clans.service'
import type { ClanInsert } from '@/types/models'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const clansService = createClansService(supabase)

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || undefined
    const ownerId = searchParams.get('ownerId') || undefined
    const limit = searchParams.has('limit') ? Number(searchParams.get('limit')) : undefined
    const offset = searchParams.has('offset') ? Number(searchParams.get('offset')) : undefined

    const result = await clansService.getClans({
      search,
      ownerId,
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
    const clansService = createClansService(supabase)
    const body = (await request.json()) as ClanInsert

    if (!body.name || !body.owner_id) {
      return NextResponse.json(
        { error: 'Campos requeridos: name y owner_id son obligatorios' },
        { status: 400 }
      )
    }

    const result = await clansService.createClan(body)

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ data: result.data }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al procesar la solicitud'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
