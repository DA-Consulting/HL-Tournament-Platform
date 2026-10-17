import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import type {
  Clan,
  ClanInsert,
  ClanUpdate,
  ClanQueryParams,
  ClanWithMembers,
  ServiceResponse,
} from '@/types/models'
import { getBrowserClient } from '@/lib/supabase/client'

export class ClansService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Obtiene la lista de clanes con soporte para filtros de búsqueda, propietario y paginación.
   */
  async getClans(params: ClanQueryParams = {}): Promise<ServiceResponse<Clan[]>> {
    try {
      let query = this.supabase.from('clans').select('*', { count: 'exact' })

      if (params.search && params.search.trim() !== '') {
        query = query.ilike('name', `%${params.search.trim()}%`)
      }

      if (params.ownerId) {
        query = query.eq('owner_id', params.ownerId)
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

      return { data: data as Clan[], error: null, count: count ?? 0 }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido al consultar clanes'
      return { data: null, error: message, count: 0 }
    }
  }

  /**
   * Obtiene un clan por su identificador único (UUID).
   */
  async getClanById(id: string): Promise<ServiceResponse<Clan>> {
    try {
      const { data, error } = await this.supabase
        .from('clans')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        return { data: null, error: error.message }
      }

      return { data: data as Clan, error: null }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al obtener el clan'
      return { data: null, error: message }
    }
  }

  /**
   * Obtiene un clan con su lista completa de jugadores miembros (relación 1:N).
   */
  async getClanWithMembers(id: string): Promise<ServiceResponse<ClanWithMembers>> {
    try {
      const { data, error } = await this.supabase
        .from('clans')
        .select(`
          *,
          players (*)
        `)
        .eq('id', id)
        .single()

      if (error) {
        return { data: null, error: error.message }
      }

      return { data: data as unknown as ClanWithMembers, error: null }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al obtener clan con miembros'
      return { data: null, error: message }
    }
  }

  /**
   * Obtiene todos los clanes creados por un owner_id específico.
   */
  async getClansByOwner(ownerId: string): Promise<ServiceResponse<Clan[]>> {
    try {
      const { data, error } = await this.supabase
        .from('clans')
        .select('*')
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false })

      if (error) {
        return { data: null, error: error.message }
      }

      return { data: data as Clan[], error: null }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al obtener clanes del propietario'
      return { data: null, error: message }
    }
  }

  /**
   * Crea un nuevo clan en la base de datos.
   */
  async createClan(clanData: ClanInsert): Promise<ServiceResponse<Clan>> {
    try {
      const { data, error } = await this.supabase
        .from('clans')
        .insert(clanData)
        .select()
        .single()

      if (error) {
        return { data: null, error: error.message }
      }

      return { data: data as Clan, error: null }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al crear el clan'
      return { data: null, error: message }
    }
  }

  /**
   * Actualiza los datos de un clan existente.
   */
  async updateClan(id: string, updates: ClanUpdate): Promise<ServiceResponse<Clan>> {
    try {
      const { data, error } = await this.supabase
        .from('clans')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return { data: null, error: error.message }
      }

      return { data: data as Clan, error: null }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al actualizar el clan'
      return { data: null, error: message }
    }
  }

  /**
   * Elimina un clan por su identificador único.
   */
  async deleteClan(id: string): Promise<ServiceResponse<boolean>> {
    try {
      const { error } = await this.supabase
        .from('clans')
        .delete()
        .eq('id', id)

      if (error) {
        return { data: null, error: error.message }
      }

      return { data: true, error: null }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al eliminar el clan'
      return { data: null, error: message }
    }
  }

  /**
   * Cuenta la cantidad total de clanes registrados.
   */
  async countClans(): Promise<ServiceResponse<number>> {
    try {
      const { count, error } = await this.supabase
        .from('clans')
        .select('*', { count: 'exact', head: true })

      if (error) {
        return { data: null, error: error.message }
      }

      return { data: count ?? 0, error: null }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al contar clanes'
      return { data: null, error: message }
    }
  }
}

/**
 * Función fábrica para instanciar el servicio con un cliente específico de Supabase.
 * Permite usar el servicio tanto en el cliente como en el servidor.
 */
export function createClansService(client?: SupabaseClient<Database>): ClansService {
  return new ClansService(client || getBrowserClient())
}
