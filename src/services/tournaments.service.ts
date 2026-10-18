import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import type {
  Tournament,
  TournamentInsert,
  TournamentUpdate,
  TournamentQueryParams,
  TournamentWithDetails,
  TournamentPlayerWithPlayer,
  TournamentMatchWithPlayers,
  ServiceResponse,
} from '@/types/models'
import { getBrowserClient } from '@/lib/supabase/client'

import {
  MOCK_TOURNAMENTS,
  MOCK_PLAYERS,
  MOCK_TOURNAMENT_PLAYERS,
  MOCK_TOURNAMENT_MATCHES,
} from '@/lib/mock-data'

export class TournamentsService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Filtra los torneos simulados (mock) cuando la base de datos está vacía o se consulta sin conexión.
   */
  private filterMockTournaments(params: TournamentQueryParams): { data: Tournament[]; count: number } {
    let filtered = [...MOCK_TOURNAMENTS]

    if (params.search && params.search.trim() !== '') {
      const term = params.search.trim().toLowerCase()
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(term) ||
          (t.game_mode && t.game_mode.toLowerCase().includes(term)) ||
          (t.description && t.description.toLowerCase().includes(term))
      )
    }

    if (params.status && params.status !== 'all') {
      filtered = filtered.filter((t) => t.status === params.status)
    }

    if (params.tournamentType && params.tournamentType !== 'all') {
      filtered = filtered.filter((t) => t.tournament_type === params.tournamentType)
    }

    if (params.playerId) {
      filtered = filtered.filter((t) => t.player_id === params.playerId)
    }

    if (params.enrolledPlayerId) {
      filtered = filtered.filter((t) => {
        const players = MOCK_TOURNAMENT_PLAYERS[t.id]
        return players && players.some((p) => p.player_id === params.enrolledPlayerId)
      })
    }

    const orderBy = params.orderBy || 'start_date'
    const ascending = params.orderAscending ?? true

    filtered.sort((a, b) => {
      const valA = a[orderBy]
      const valB = b[orderBy]

      if (orderBy === 'start_date' || orderBy === 'created_at') {
        const timeA = new Date((valA as string) || 0).getTime()
        const timeB = new Date((valB as string) || 0).getTime()
        return ascending ? timeA - timeB : timeB - timeA
      } else if (orderBy === 'prize_pool_amount') {
        const numA = Number(valA) || 0
        const numB = Number(valB) || 0
        return ascending ? numA - numB : numB - numA
      } else if (typeof valA === 'string' && typeof valB === 'string') {
        return ascending ? valA.localeCompare(valB) : valB.localeCompare(valA)
      }

      const strA = String(valA ?? '')
      const strB = String(valB ?? '')
      return ascending ? strA.localeCompare(strB) : strB.localeCompare(strA)
    })

    const totalCount = filtered.length
    const offset = params.offset ?? 0
    const limit = params.limit ?? 20

    const sliced = filtered.slice(offset, offset + limit)
    return { data: sliced, count: totalCount }
  }

  /**
   * Obtiene la lista de torneos con soporte para búsqueda por título,
   * filtro por estado ('ongoing', 'upcoming', 'registration_open', 'completed'),
   * tipo de torneo ('league', 'team', 'individual') y paginación (por defecto 20).
   */
  async getTournaments(params: TournamentQueryParams = {}): Promise<ServiceResponse<Tournament[]>> {
    try {
      let query = this.supabase.from('tournaments').select('*', { count: 'exact' })

      if (params.search && params.search.trim() !== '') {
        query = query.ilike('title', `%${params.search.trim()}%`)
      }

      if (params.status && params.status !== 'all') {
        query = query.eq('status', params.status)
      }

      if (params.tournamentType && params.tournamentType !== 'all') {
        query = query.eq('tournament_type', params.tournamentType)
      }

      if (params.playerId) {
        query = query.eq('player_id', params.playerId)
      }

      if (params.enrolledPlayerId) {
        const { data: enrolledData } = await this.supabase
          .from('tournament_players')
          .select('tournament_id')
          .eq('player_id', params.enrolledPlayerId)

        const tournamentIds = (enrolledData || []).map((row) => row.tournament_id)
        if (tournamentIds.length === 0) {
          const fallback = this.filterMockTournaments(params)
          return { data: fallback.data, error: null, count: fallback.count }
        }
        query = query.in('id', tournamentIds)
      }

      const orderBy = params.orderBy || 'start_date'
      const ascending = params.orderAscending ?? true
      query = query.order(orderBy, { ascending })

      const limit = params.limit ?? 20
      if (typeof params.offset === 'number') {
        query = query.range(params.offset, params.offset + limit - 1)
      } else {
        query = query.limit(limit)
      }

      const { data, error, count } = await query
      if (error) {
        const fallback = this.filterMockTournaments(params)
        return { data: fallback.data, error: error.message, count: fallback.count }
      }

      const list = (data || []) as Tournament[]

      // Complementar con los torneos mock (como los nuevos de Formato Liga y de otras fechas)
      // evitando duplicados de ID para garantizar que la plataforma cuente con el catálogo completo y paginación
      const dbIds = new Set(list.map((t) => t.id))
      const mockResult = this.filterMockTournaments(params)
      const missingMocks = mockResult.data.filter((mock) => !dbIds.has(mock.id))
      const combined = [...list, ...missingMocks]

      const totalCount = Math.max(count ?? 0, combined.length)

      return { data: combined, error: null, count: totalCount }
    } catch {
      const fallback = this.filterMockTournaments(params)
      return { data: fallback.data, error: null, count: fallback.count }
    }
  }

  /**
   * Obtiene la lista de IDs de torneos en los que un jugador está inscrito.
   */
  async getUserEnrolledTournamentIds(playerId: string): Promise<string[]> {
    try {
      const { data, error } = await this.supabase
        .from('tournament_players')
        .select('tournament_id')
        .eq('player_id', playerId)

      if (!error && data && data.length > 0) {
        return data.map((r) => r.tournament_id)
      }

      const mockIds: string[] = []
      for (const [tournamentId, players] of Object.entries(MOCK_TOURNAMENT_PLAYERS)) {
        if (players.some((p) => p.player_id === playerId)) {
          mockIds.push(tournamentId)
        }
      }
      return mockIds
    } catch {
      const mockIds: string[] = []
      for (const [tournamentId, players] of Object.entries(MOCK_TOURNAMENT_PLAYERS)) {
        if (players.some((p) => p.player_id === playerId)) {
          mockIds.push(tournamentId)
        }
      }
      return mockIds
    }
  }

  /**
   * Obtiene la cantidad de participantes inscritos por cada torneo.
   */
  async getTournamentPlayerCounts(): Promise<Record<string, number>> {
    try {
      const { data, error } = await this.supabase
        .from('tournament_players')
        .select('tournament_id')

      const counts: Record<string, number> = {}
      if (!error && data && data.length > 0) {
        for (const row of data) {
          counts[row.tournament_id] = (counts[row.tournament_id] || 0) + 1
        }
        return counts
      }

      for (const [tournamentId, players] of Object.entries(MOCK_TOURNAMENT_PLAYERS)) {
        counts[tournamentId] = players.length
      }
      for (const t of MOCK_TOURNAMENTS) {
        if (!counts[t.id]) {
          counts[t.id] = Math.floor((t.max_participants || 16) * 0.6)
        }
      }
      return counts
    } catch {
      const counts: Record<string, number> = {}
      for (const [tournamentId, players] of Object.entries(MOCK_TOURNAMENT_PLAYERS)) {
        counts[tournamentId] = players.length
      }
      for (const t of MOCK_TOURNAMENTS) {
        if (!counts[t.id]) {
          counts[t.id] = Math.floor((t.max_participants || 16) * 0.6)
        }
      }
      return counts
    }
  }

  /**
   * Obtiene los torneos destacados para el carrusel principal (Hero).
   * Prioriza torneos 'ongoing', 'registration_open' y 'upcoming' ordenados por fecha de inicio y premio.
   */
  async getFeaturedTournaments(limit: number = 5): Promise<ServiceResponse<Tournament[]>> {
    try {
      const { data, error, count } = await this.supabase
        .from('tournaments')
        .select('*', { count: 'exact' })
        .in('status', ['ongoing', 'registration_open', 'upcoming'])
        .order('start_date', { ascending: true })
        .limit(limit)

      if (error) {
        return { data: null, error: error.message, count: 0 }
      }

      // Si no hay torneos activos o próximos, retorna los más recientes
      if (!data || data.length === 0) {
        const fallback = await this.supabase
          .from('tournaments')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .limit(limit)

        return {
          data: (fallback.data || []) as Tournament[],
          error: fallback.error ? fallback.error.message : null,
          count: fallback.count ?? 0,
        }
      }

      return { data: data as Tournament[], error: null, count: count ?? 0 }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al obtener torneos destacados'
      return { data: null, error: message, count: 0 }
    }
  }

  /**
   * Obtiene un torneo por su identificador único (UUID) incluyendo el organizador y ganador.
   */
  async getTournamentById(id: string): Promise<ServiceResponse<TournamentWithDetails>> {
    try {
      const { data, error } = await this.supabase
        .from('tournaments')
        .select(
          `
          *,
          organizer:players!tournaments_player_id_fkey (*),
          winner:players!tournaments_winner_player_id_fkey (*)
        `
        )
        .eq('id', id)
        .maybeSingle()

      if (error || !data) {
        const mockTour = MOCK_TOURNAMENTS.find((t) => t.id === id)
        if (mockTour) {
          const mockOrganizer = MOCK_PLAYERS.find((p) => p.id === mockTour.player_id)
          const mockWinner = mockTour.winner_player_id
            ? MOCK_PLAYERS.find((p) => p.id === mockTour.winner_player_id)
            : null
          return {
            data: {
              ...mockTour,
              organizer: mockOrganizer || null,
              winner: mockWinner || null,
            },
            error: null,
          }
        }
        return { data: null, error: error?.message || 'Torneo no encontrado' }
      }

      return { data: data as unknown as TournamentWithDetails, error: null }
    } catch (err: unknown) {
      const mockTour = MOCK_TOURNAMENTS.find((t) => t.id === id)
      if (mockTour) {
        const mockOrganizer = MOCK_PLAYERS.find((p) => p.id === mockTour.player_id)
        return {
          data: {
            ...mockTour,
            organizer: mockOrganizer || null,
            winner: null,
          },
          error: null,
        }
      }
      const message = err instanceof Error ? err.message : 'Error al consultar el torneo'
      return { data: null, error: message }
    }
  }

  /**
   * Crea un nuevo torneo en la base de datos.
   */
  async createTournament(tournamentData: TournamentInsert): Promise<ServiceResponse<Tournament>> {
    try {
      const { data, error } = await this.supabase
        .from('tournaments')
        .insert(tournamentData)
        .select()
        .single()

      if (error) {
        return { data: null, error: error.message }
      }

      return { data: data as Tournament, error: null }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al crear el torneo'
      return { data: null, error: message }
    }
  }

  /**
   * Actualiza los datos de un torneo existente.
   */
  async updateTournament(id: string, updates: TournamentUpdate): Promise<ServiceResponse<Tournament>> {
    try {
      const { data, error } = await this.supabase
        .from('tournaments')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return { data: null, error: error.message }
      }

      return { data: data as Tournament, error: null }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al actualizar el torneo'
      return { data: null, error: message }
    }
  }

  /**
   * Elimina un torneo por su identificador único.
   */
  async deleteTournament(id: string): Promise<ServiceResponse<boolean>> {
    try {
      const { error } = await this.supabase.from('tournaments').delete().eq('id', id)

      if (error) {
        return { data: null, error: error.message }
      }

      return { data: true, error: null }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al eliminar el torneo'
      return { data: null, error: message }
    }
  }

  /**
   * Conteo de torneos según su estado.
   */
  async countTournaments(status?: string): Promise<ServiceResponse<number>> {
    try {
      let query = this.supabase.from('tournaments').select('*', { count: 'exact', head: true })

      if (status && status !== 'all') {
        query = query.eq('status', status)
      }

      const { count, error } = await query

      if (error) {
        return { data: null, error: error.message }
      }

      return { data: count ?? 0, error: null }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al contar torneos'
      return { data: null, error: message }
    }
  }

  /**
   * Obtiene los jugadores inscritos en un torneo ordenados por puntaje y partidas ganadas.
   */
  async getTournamentPlayers(tournamentId: string): Promise<ServiceResponse<TournamentPlayerWithPlayer[]>> {
    try {
      const { data, error } = await this.supabase
        .from('tournament_players')
        .select(`
          *,
          player:players (
            *,
            clan:clans (*)
          )
        `)
        .eq('tournament_id', tournamentId)
        .order('score', { ascending: false })
        .order('matches_won', { ascending: false })

      if (error || !data || data.length === 0) {
        if (MOCK_TOURNAMENT_PLAYERS[tournamentId]) {
          return { data: MOCK_TOURNAMENT_PLAYERS[tournamentId], error: null }
        }
      }

      return { data: (data as unknown as TournamentPlayerWithPlayer[]) || [], error: null }
    } catch {
      if (MOCK_TOURNAMENT_PLAYERS[tournamentId]) {
        return { data: MOCK_TOURNAMENT_PLAYERS[tournamentId], error: null }
      }
      return { data: [], error: 'Error al consultar inscritos del torneo' }
    }
  }

  /**
   * Obtiene las partidas jugadas o programadas de un torneo con datos de los jugadores.
   */
  async getTournamentMatches(tournamentId: string): Promise<ServiceResponse<TournamentMatchWithPlayers[]>> {
    try {
      const { data, error } = await this.supabase
        .from('tournament_matches')
        .select(`
          *,
          player1:players!tournament_matches_player1_id_fkey (
            *,
            clan:clans (*)
          ),
          player2:players!tournament_matches_player2_id_fkey (
            *,
            clan:clans (*)
          ),
          winner:players!tournament_matches_winner_player_id_fkey (
            *,
            clan:clans (*)
          )
        `)
        .eq('tournament_id', tournamentId)
        .order('played_at', { ascending: false, nullsFirst: false })

      if (error || !data || data.length === 0) {
        if (MOCK_TOURNAMENT_MATCHES[tournamentId]) {
          return { data: MOCK_TOURNAMENT_MATCHES[tournamentId], error: null }
        }
      }

      return { data: (data as unknown as TournamentMatchWithPlayers[]) || [], error: null }
    } catch {
      if (MOCK_TOURNAMENT_MATCHES[tournamentId]) {
        return { data: MOCK_TOURNAMENT_MATCHES[tournamentId], error: null }
      }
      return { data: [], error: 'Error al consultar partidas del torneo' }
    }
  }
}

/**
 * Función fábrica para instanciar el servicio con el cliente de Supabase.
 */
export function createTournamentsService(client?: SupabaseClient<Database>): TournamentsService {
  return new TournamentsService(client || getBrowserClient())
}
