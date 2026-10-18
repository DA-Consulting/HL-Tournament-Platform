import React from 'react'
import { connection } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createTournamentsService } from '@/services/tournaments.service'
import { createPlayersService } from '@/services/players.service'
import { Navbar } from '@/components/Navbar'
import { TournamentsListClient } from './TournamentsListClient'
import type { Player } from '@/types/models'

/**
 * Server Component para el listado de torneos (/tournaments).
 * Aplica connection() para asegurar la carga dinámica sin conflictos con prerenderizado.
 */
export default async function TournamentsPage() {
  await connection()

  const supabase = await createClient()
  const tournamentsService = createTournamentsService(supabase)
  const playersService = createPlayersService(supabase)

  // 1. Obtener torneos con un límite amplio para filtrado y paginación rápida del lado cliente
  const tournamentsRes = await tournamentsService.getTournaments({ limit: 100 })
  const tournaments = tournamentsRes.data || []

  // 2. Obtener conteos de participantes por torneo
  const participantCounts = await tournamentsService.getTournamentPlayerCounts()

  // 3. Obtener sesión de usuario actual
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let currentPlayer: Player | null = null
  let enrolledTournamentIds: string[] = []

  if (user) {
    const playerRes = await playersService.getPlayerByUserId(user.id)
    currentPlayer = playerRes.data

    if (currentPlayer) {
      enrolledTournamentIds = await tournamentsService.getUserEnrolledTournamentIds(currentPlayer.id)
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: '#0d0d0d' }}>
      <Navbar activeSection="tournaments" />
      <TournamentsListClient
        initialTournaments={tournaments}
        enrolledTournamentIds={enrolledTournamentIds}
        participantCounts={participantCounts}
        currentPlayer={currentPlayer}
      />
    </main>
  )
}
