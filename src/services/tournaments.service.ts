import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import type {
  Tournament,
  TournamentInsert,
  TournamentUpdate,
  TournamentQueryParams,
  TournamentWithDetails,
  ServiceResponse,
} from '@/types/models'
import { getBrowserClient } from '@/lib/supabase/client'

export class TournamentsService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Obtiene la lista de torneos con soporte para búsqueda por título,
   * filtro por estado ('ongoing', 'upcoming', 'registration_open', 'completed'),
   * tipo de torneo y paginación.
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

      const orderBy = params.orderBy || 'start_date'
      const ascending = params.orderAscending ?? true
      query = query.order(orderBy, { ascending })

      if (typeof params.offset === 'number' && typeof params.limit === 'number') {
        query = query.range(params.offset, params.offset + params.limit - 1)
      } else if (typeof params.limit === 'number') {
        query = query.limit(params.limit)
      }

      const { data, error, count } = await query

      if (error) {
        return { data: null, error: error.message, count: 0 }
      }

      return { data: data as Tournament[], error: null, count: count ?? 0 }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al consultar torneos'
      return { data: null, error: message, count: 0 }
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
        .single()

      if (error) {
        return { data: null, error: error.message }
      }

      return { data: data as unknown as TournamentWithDetails, error: null }
    } catch (err: unknown) {
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
}

/**
 * Función fábrica para instanciar el servicio con el cliente de Supabase.
 */
export function createTournamentsService(client?: SupabaseClient<Database>): TournamentsService {
  return new TournamentsService(client || getBrowserClient())
}
