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

/**
 * Server Action para inscribir al jugador autenticado en un torneo.
 */
export async function registerToTournamentAction(
  tournamentId: string
): Promise<ActionResponse<{ id: string; tournament_id: string; player_id: string }>> {
  try {
    if (!tournamentId) {
      return {
        success: false,
        message: 'Identificador del torneo no proporcionado.',
        code: 'VALIDATION_ERROR',
      }
    }

    const supabase = await createClient()

    // 1. Verificar usuario autenticado
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser()

    if (authErr || !user) {
      return {
        success: false,
        message: 'Debes iniciar sesión para inscribirte en este torneo.',
        code: 'UNAUTHORIZED',
      }
    }

    // 2. Obtener el registro de Player del usuario
    const { data: player, error: playerErr } = await supabase
      .from('players')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (playerErr || !player) {
      return {
        success: false,
        message: 'No se encontró tu ficha de jugador. Por favor completa tu perfil.',
        code: 'PLAYER_NOT_FOUND',
      }
    }

    // 3. Validar vinculación obligatoria de Steam
    if (!player.steam_id) {
      return {
        success: false,
        message: 'Para participar en torneos debes vincular tu Steam ID en tu Perfil.',
        code: 'STEAM_REQUIRED',
      }
    }

    // 4. Verificar estado del torneo y cupos
    const { data: tournament, error: tourErr } = await supabase
      .from('tournaments')
      .select('id, status, max_participants')
      .eq('id', tournamentId)
      .single()

    if (tourErr || !tournament) {
      return {
        success: false,
        message: 'El torneo solicitado no existe.',
        code: 'TOURNAMENT_NOT_FOUND',
      }
    }

    if (tournament.status === 'completed' || tournament.status === 'cancelled') {
      return {
        success: false,
        message: 'Este torneo ya ha finalizado o ha sido cancelado.',
        code: 'TOURNAMENT_CLOSED',
      }
    }

    // 5. Verificar si ya está inscrito
    const { data: alreadyEnrolled } = await supabase
      .from('tournament_players')
      .select('id')
      .eq('tournament_id', tournamentId)
      .eq('player_id', player.id)
      .maybeSingle()

    if (alreadyEnrolled) {
      return {
        success: false,
        message: 'Ya te encuentras registrado en este torneo.',
        code: 'ALREADY_REGISTERED',
      }
    }

    // 6. Verificar límite de participantes
    const { count } = await supabase
      .from('tournament_players')
      .select('*', { count: 'exact', head: true })
      .eq('tournament_id', tournamentId)

    if (tournament.max_participants && (count ?? 0) >= tournament.max_participants) {
      return {
        success: false,
        message: 'El torneo ha alcanzado el límite máximo de participantes.',
        code: 'TOURNAMENT_FULL',
      }
    }

    // 7. Insertar inscripción
    const { data: newEntry, error: insertErr } = await supabase
      .from('tournament_players')
      .insert({
        tournament_id: tournamentId,
        player_id: player.id,
        score: 0,
        matches_played: 0,
        matches_won: 0,
        matches_lost: 0,
        status: 'confirmed',
      })
      .select()
      .single()

    if (insertErr) {
      return handleActionError(insertErr, 'No se pudo completar la inscripción.')
    }

    revalidatePath(`/tournament/${tournamentId}`)
    revalidatePath('/')

    return handleActionSuccess('¡Inscripción exitosa! Has sido registrado en el torneo.', {
      id: newEntry.id,
      tournament_id: newEntry.tournament_id,
      player_id: newEntry.player_id,
    })
  } catch (criticalError: unknown) {
    console.error('[CRITICAL registerToTournamentAction error]:', criticalError)
    return {
      success: false,
      message: 'Ocurrió un error inesperado al procesar tu inscripción en el servidor.',
      code: 'SERVER_EXCEPTION',
    }
  }
}

