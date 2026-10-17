import type { Database } from './database.types'

// Entidades base
export type Clan = Database['public']['Tables']['clans']['Row']
export type ClanInsert = Database['public']['Tables']['clans']['Insert']
export type ClanUpdate = Database['public']['Tables']['clans']['Update']

export type Player = Database['public']['Tables']['players']['Row']
export type PlayerInsert = Database['public']['Tables']['players']['Insert']
export type PlayerUpdate = Database['public']['Tables']['players']['Update']

// Relaciones extendidas
export interface ClanWithMembers extends Clan {
  players: Player[]
}

export interface PlayerWithClan extends Player {
  clan: Clan | null
}

// Parámetros de consulta para filtrado y paginación
export interface PaginationOptions {
  limit?: number
  offset?: number
}

export interface ClanQueryParams extends PaginationOptions {
  search?: string
  ownerId?: string
  orderBy?: 'name' | 'created_at' | 'updated_at'
  orderAscending?: boolean
}

export interface PlayerQueryParams extends PaginationOptions {
  search?: string
  steamId?: string
  clanId?: string | null
  unassignedOnly?: boolean
  orderBy?: 'name' | 'created_at' | 'updated_at'
  orderAscending?: boolean
}

// Respuesta estandarizada para consultas de servicio
export interface ServiceResponse<T> {
  data: T | null
  error: string | null
  count?: number | null
}
