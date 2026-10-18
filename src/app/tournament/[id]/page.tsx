import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createTournamentsService } from '@/services/tournaments.service'
import { createPlayersService } from '@/services/players.service'
import { Navbar } from '@/components/Navbar'
import type { Player } from '@/types/models'
import { TournamentDetailClient } from './TournamentDetailClient'

interface TournamentPageProps {
  params: Promise<{
    id: string
  }>
}

/**
 * Server Component para la vista detallada del torneo (/tournament/[id]).
 * Emplea streaming nativo con Suspense y app/tournament/[id]/loading.tsx,
 * evaluando dinámicamente con connection() la autenticación del usuario y
 * los datos del torneo.
 */
export default async function TournamentDetailPage({ params }: TournamentPageProps) {
  // Asegura conexión dinámica para evitar evaluar tokens de sesión en prerender estático
  await connection()

  const { id } = await params
  const supabase = await createClient()
  const tournamentsService = createTournamentsService(supabase)
  const playersService = createPlayersService(supabase)

  // 1. Obtener información detallada del torneo
  const { data: tournament } = await tournamentsService.getTournamentById(id)

  if (!tournament) {
    notFound()
  }

  // 2. Obtener inscritos y partidas en paralelo
  const [playersRes, matchesRes] = await Promise.all([
    tournamentsService.getTournamentPlayers(id),
    tournamentsService.getTournamentMatches(id),
  ])

  const players = playersRes.data || []
  const matches = matchesRes.data || []

  // 3. Obtener sesión de usuario actual si existe
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let currentPlayer: Player | null = null
  let isRegistered = false

  if (user) {
    const pRes = await playersService.getPlayerByUserId(user.id)
    const currentPlayerData = pRes.data
    currentPlayer = currentPlayerData
    if (currentPlayerData) {
      isRegistered = players.some((entry) => entry.player_id === currentPlayerData.id)
    }
  }

  return (
    <>
      <Navbar activeSection="tournaments" />
      <TournamentDetailClient
        tournament={tournament}
        initialPlayers={players}
        initialMatches={matches}
        currentUser={user ? { id: user.id, email: user.email || '' } : null}
        currentPlayer={currentPlayer}
        isRegisteredInitial={isRegistered}
      />
    </>
  )
}
