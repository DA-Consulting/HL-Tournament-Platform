import React from 'react'
import { connection } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPlayersService } from '@/services/players.service'
import { Navbar } from '@/components/Navbar'
import { CreateTournamentClient } from './CreateTournamentClient'
import type { Player } from '@/types/models'

/**
 * Server Component para la vista de creación de torneos (/tournaments/new).
 * Ejecuta connection() para garantizar la evaluación dinámica de cookies y auth en Next.js.
 */
export default async function CreateTournamentPage() {
  await connection()

  const supabase = await createClient()
  const playersService = createPlayersService(supabase)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let currentPlayer: Player | null = null

  if (user) {
    const playerRes = await playersService.getPlayerByUserId(user.id)
    currentPlayer = playerRes.data
  }

  return (
    <main style={{ minHeight: '100vh', background: '#0d0d0d' }}>
      <Navbar activeSection="tournaments" />
      <CreateTournamentClient currentPlayer={currentPlayer} />
    </main>
  )
}
