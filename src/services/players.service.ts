import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import type {
  Player,
  PlayerInsert,
  PlayerUpdate,
  PlayerQueryParams,
  PlayerWithClan,
  ServiceResponse,
} from '@/types/models'
import { getBrowserClient } from '@/lib/supabase/client'

export class PlayersService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Obtiene la lista de jugadores con soporte para búsqueda (por nombre), filtro por clan y paginación.
   */
  async getPlayers(params: PlayerQueryParams = {}): Promise<ServiceResponse<Player[]>> {
    try {
      let query = this.supabase.from('players').select('*', { count: 'exact' })

      if (params.search && params.search.trim() !== '') {
        query = query.ilike('name', `%${params.search.trim()}%`)
      }

      if (params.steamId) {
        query = query.eq('steam_id', params.steamId)
      }

      if (params.userId) {
        query = query.eq('user_id', params.userId)
      }

      if (params.unassignedOnly) {
        query = query.is('clan_id', null)
      } else if (params.clanId !== undefined) {
        if (params.clanId === null) {
          query = query.is('clan_id', null)
        } else {
          query = query.eq('clan_id', params.clanId)
        }
      }

      const orderBy = params.orderBy || 'created_at'
      const ascending = params.orderAscending ?? false
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

      return { data: data as Player[], error: null, count: count ?? 0 }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido al consultar jugadores'
      return { data: null, error: message, count: 0 }
    }
  }

  /**
   * Obtiene la lista de jugadores incluyendo la información detallada del clan al que pertenecen (JOIN).
   */
  async getPlayersWithClan(params: PlayerQueryParams = {}): Promise<ServiceResponse<PlayerWithClan[]>> {
    try {
      let query = this.supabase.from('players').select(
        `
        *,
        clan:clans (*)
      `,
        { count: 'exact' }
      )

      if (params.search && params.search.trim() !== '') {
        query = query.ilike('name', `%${params.search.trim()}%`)
      }

      if (params.clanId) {
        query = query.eq('clan_id', params.clanId)
      }

      const orderBy = params.orderBy || 'created_at'
      const ascending = params.orderAscending ?? false
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

      return { data: data as unknown as PlayerWithClan[], error: null, count: count ?? 0 }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al consultar jugadores con clan'
      return { data: null, error: message, count: 0 }
    }
  }

  /**
   * Obtiene un jugador por su identificador único (UUID).
   */
  async getPlayerById(id: string): Promise<ServiceResponse<Player>> {
    try {
      const { data, error } = await this.supabase
        .from('players')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        return { data: null, error: error.message }
      }

      return { data: data as Player, error: null }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al obtener el jugador'
      return { data: null, error: message }
    }
  }

  /**
   * Obtiene un jugador por su identificador único incluyendo los datos del clan.
   */
  async getPlayerWithClanById(id: string): Promise<ServiceResponse<PlayerWithClan>> {
    try {
      const { data, error } = await this.supabase
        .from('players')
        .select(`
          *,
          clan:clans (*)
        `)
        .eq('id', id)
        .single()

      if (error) {
        return { data: null, error: error.message }
      }

      return { data: data as unknown as PlayerWithClan, error: null }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al obtener jugador con clan'
      return { data: null, error: message }
    }
  }

  /**
   * Busca un jugador por su identificador exacto de Steam (steam_id).
   * Útil para autenticación o vinculación de cuentas de Steam.
   */
  async getPlayerBySteamId(steamId: string): Promise<ServiceResponse<Player>> {
    try {
      const { data, error } = await this.supabase
        .from('players')
        .select('*')
        .eq('steam_id', steamId.trim())
        .maybeSingle()

      if (error) {
        return { data: null, error: error.message }
      }

      return { data: data as Player | null, error: null }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al buscar jugador por Steam ID'
      return { data: null, error: message }
    }
  }

  /**
   * Obtiene el jugador vinculado a una cuenta de usuario de Supabase Auth (user_id).
   */
  async getPlayerByUserId(userId: string): Promise<ServiceResponse<Player>> {
    try {
      const { data, error } = await this.supabase
        .from('players')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) {
        return { data: null, error: error.message }
      }

      return { data: data as Player | null, error: null }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al buscar jugador por User ID'
      return { data: null, error: message }
    }
  }

  /**
   * Asegura que exista un registro de jugador para el usuario autenticado.
   * Si no existe, lo crea automáticamente.
   */
  async ensurePlayerForUser(userId: string, defaultName: string): Promise<ServiceResponse<Player>> {
    try {
      // 1. Verificar si ya existe
      const existing = await this.getPlayerByUserId(userId)
      if (existing.data) {
        return existing
      }

      // 2. Si no existe, crearlo
      const { data, error } = await this.supabase
        .from('players')
        .insert({
          user_id: userId,
          name: defaultName,
          steam_id: null,
          avatar_url: null,
        })
        .select()
        .single()

      if (error) {
        return { data: null, error: error.message }
      }

      return { data: data as Player, error: null }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al asegurar registro de jugador'
      return { data: null, error: message }
    }
  }

  /**
   * Obtiene todos los jugadores pertenecientes a un clan específico.
   */
  async getPlayersByClanId(clanId: string): Promise<ServiceResponse<Player[]>> {
    try {
      const { data, error } = await this.supabase
        .from('players')
        .select('*')
        .eq('clan_id', clanId)
        .order('name', { ascending: true })

      if (error) {
        return { data: null, error: error.message }
      }

      return { data: data as Player[], error: null }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al obtener jugadores del clan'
      return { data: null, error: message }
    }
  }

  /**
   * Obtiene los jugadores que aún no pertenecen a ningún clan (agentes libres).
   */
  async getUnassignedPlayers(): Promise<ServiceResponse<Player[]>> {
    try {
      const { data, error } = await this.supabase
        .from('players')
        .select('*')
        .is('clan_id', null)
        .order('name', { ascending: true })

      if (error) {
        return { data: null, error: error.message }
      }

      return { data: data as Player[], error: null }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al obtener jugadores sin clan'
      return { data: null, error: message }
    }
  }

  /**
   * Crea un nuevo registro de jugador.
   */
  async createPlayer(playerData: PlayerInsert): Promise<ServiceResponse<Player>> {
    try {
      const { data, error } = await this.supabase
        .from('players')
        .insert(playerData)
        .select()
        .single()

      if (error) {
        return { data: null, error: error.message }
      }

      return { data: data as Player, error: null }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al registrar el jugador'
      return { data: null, error: message }
    }
  }

  /**
   * Actualiza la información de un jugador existente.
   */
  async updatePlayer(id: string, updates: PlayerUpdate): Promise<ServiceResponse<Player>> {
    try {
      const { data, error } = await this.supabase
        .from('players')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return { data: null, error: error.message }
      }

      return { data: data as Player, error: null }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al actualizar el jugador'
      return { data: null, error: message }
    }
  }

  /**
   * Asigna o remueve un jugador de un clan (pasa null para desvincular).
   */
  async assignToClan(playerId: string, clanId: string | null): Promise<ServiceResponse<Player>> {
    return this.updatePlayer(playerId, { clan_id: clanId })
  }

  /**
   * Elimina un jugador por su identificador único.
   */
  async deletePlayer(id: string): Promise<ServiceResponse<boolean>> {
    try {
      const { error } = await this.supabase
        .from('players')
        .delete()
        .eq('id', id)

      if (error) {
        return { data: null, error: error.message }
      }

      return { data: true, error: null }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al eliminar el jugador'
      return { data: null, error: message }
    }
  }

  /**
   * Cuenta la cantidad de jugadores registrados, opcionalmente filtrando por clan.
   */
  async countPlayers(clanId?: string): Promise<ServiceResponse<number>> {
    try {
      let query = this.supabase
        .from('players')
        .select('*', { count: 'exact', head: true })

      if (clanId) {
        query = query.eq('clan_id', clanId)
      }

      const { count, error } = await query

      if (error) {
        return { data: null, error: error.message }
      }

      return { data: count ?? 0, error: null }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al contar jugadores'
      return { data: null, error: message }
    }
  }
}

/**
 * Función fábrica para instanciar el servicio con un cliente específico de Supabase.
 */
export function createPlayersService(client?: SupabaseClient<Database>): PlayersService {
  return new PlayersService(client || getBrowserClient())
}
