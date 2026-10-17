'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  type ActionResponse,
  handleActionError,
  handleActionSuccess,
} from '@/lib/action-response'
import type { Tournament, TournamentInsert, TournamentUpdate } from '@/types/models'

/**
 * Server Action para crear un torneo en Supabase.
 */
export async function createTournamentAction(
  tournamentData: TournamentInsert
): Promise<ActionResponse<Tournament>> {
  try {
    if (!tournamentData.title?.trim()) {
      return {
        success: false,
        message: 'El título del torneo es obligatorio.',
        code: 'VALIDATION_ERROR',
      }
    }

    if (!tournamentData.start_date) {
      return {
        success: false,
        message: 'La fecha de inicio del torneo es requerida.',
        code: 'VALIDATION_ERROR',
      }
    }

    const supabase = await createClient()

    // Supabase CRUD devuelve { data, error } sin lanzar excepciones
    const { data, error } = await supabase
      .from('tournaments')
      .insert({
        title: tournamentData.title.trim(),
        description: tournamentData.description?.trim() || null,
        player_id: tournamentData.player_id,
        status: tournamentData.status || 'upcoming',
        start_date: tournamentData.start_date,
        end_date: tournamentData.end_date || null,
        prize_pool_currency: tournamentData.prize_pool_currency || 'PEN',
        prize_pool_amount: Number(tournamentData.prize_pool_amount) || 0,
        tournament_type: tournamentData.tournament_type || 'individual',
        banner_url: tournamentData.banner_url || null,
        game_mode: tournamentData.game_mode || 'Half-Life: Deathmatch (Crossfire)',
        max_participants: Number(tournamentData.max_participants) || 16,
      })
      .select()
      .single()

    if (error) {
      return handleActionError(error, 'No se pudo crear el torneo.')
    }

    revalidatePath('/')
    return handleActionSuccess(
      `¡Torneo "${data.title}" creado y publicado con éxito!`,
      data as Tournament
    )
  } catch (criticalError: unknown) {
    console.error('[CRITICAL createTournamentAction error]:', criticalError)
    return {
      success: false,
      message: 'Ocurrió un error inesperado en el servidor al registrar el torneo.',
      code: 'SERVER_EXCEPTION',
    }
  }
}

/**
 * Server Action para actualizar un torneo.
 */
export async function updateTournamentAction(
  id: string,
  updates: TournamentUpdate
): Promise<ActionResponse<Tournament>> {
  try {
    if (!id) {
      return {
        success: false,
        message: 'Identificador de torneo no especificado.',
        code: 'VALIDATION_ERROR',
      }
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('tournaments')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return handleActionError(error, 'No se pudo actualizar el torneo.')
    }

    revalidatePath('/')
    return handleActionSuccess('Torneo actualizado correctamente.', data as Tournament)
  } catch (criticalError: unknown) {
    console.error('[CRITICAL updateTournamentAction error]:', criticalError)
    return {
      success: false,
      message: 'Fallo crítico al actualizar el torneo.',
      code: 'SERVER_EXCEPTION',
    }
  }
}

/**
 * Server Action para eliminar un torneo.
 */
export async function deleteTournamentAction(
  id: string
): Promise<ActionResponse<boolean>> {
  try {
    if (!id) {
      return {
        success: false,
        message: 'Identificador de torneo no especificado.',
        code: 'VALIDATION_ERROR',
      }
    }

    const supabase = await createClient()
    const { error } = await supabase.from('tournaments').delete().eq('id', id)

    if (error) {
      return handleActionError(error, 'No se pudo eliminar el torneo.')
    }

    revalidatePath('/')
    return handleActionSuccess('Torneo eliminado correctamente.', true)
  } catch (criticalError: unknown) {
    console.error('[CRITICAL deleteTournamentAction error]:', criticalError)
    return {
      success: false,
      message: 'Error al intentar eliminar el torneo en el servidor.',
      code: 'SERVER_EXCEPTION',
    }
  }
}
