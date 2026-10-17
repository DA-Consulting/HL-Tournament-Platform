'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  type ActionResponse,
  handleActionError,
  handleActionSuccess,
} from '@/lib/action-response'
import type { Player, PlayerInsert, PlayerUpdate, Profile } from '@/types/models'

/**
 * Server Action para registrar un nuevo jugador.
 */
export async function createPlayerAction(
  playerData: PlayerInsert
): Promise<ActionResponse<Player>> {
  try {
    if (!playerData.name?.trim()) {
      return {
        success: false,
        message: 'El nombre del combatiente es obligatorio.',
        code: 'VALIDATION_ERROR',
      }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('players')
      .insert({
        name: playerData.name.trim(),
        steam_id: playerData.steam_id?.trim() || null,
        avatar_url: playerData.avatar_url || null,
        clan_id: playerData.clan_id || null,
        user_id: playerData.user_id || null,
      })
      .select()
      .single()

    if (error) {
      return handleActionError(error, 'No se pudo registrar al jugador.')
    }

    revalidatePath('/')
    return handleActionSuccess(
      `¡Combatiente "${data.name}" registrado con éxito!`,
      data as Player
    )
  } catch (criticalError: unknown) {
    console.error('[CRITICAL createPlayerAction error]:', criticalError)
    return {
      success: false,
      message: 'Ocurrió un error inesperado al registrar al jugador.',
      code: 'SERVER_EXCEPTION',
    }
  }
}

/**
 * Server Action para actualizar un jugador existente.
 */
export async function updatePlayerAction(
  id: string,
  updates: PlayerUpdate
): Promise<ActionResponse<Player>> {
  try {
    if (!id) {
      return {
        success: false,
        message: 'Identificador de jugador no especificado.',
        code: 'VALIDATION_ERROR',
      }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('players')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return handleActionError(error, 'No se pudo actualizar la información del jugador.')
    }

    revalidatePath('/')
    revalidatePath('/profile')
    return handleActionSuccess('Información del jugador actualizada.', data as Player)
  } catch (criticalError: unknown) {
    console.error('[CRITICAL updatePlayerAction error]:', criticalError)
    return {
      success: false,
      message: 'Fallo al actualizar al jugador en el servidor.',
      code: 'SERVER_EXCEPTION',
    }
  }
}

/**
 * Server Action para guardar integralmente los datos del perfil y jugador autenticado.
 */
export async function saveProfileAction(params: {
  displayName: string
  playerName: string
  steamId?: string | null
  avatarUrl?: string | null
  clanId?: string | null
}): Promise<ActionResponse<{ profile: Profile; player: Player }>> {
  try {
    const { displayName, playerName, steamId, avatarUrl, clanId } = params

    if (!playerName?.trim()) {
      return {
        success: false,
        message: 'El nombre del jugador en el juego es obligatorio.',
        code: 'VALIDATION_ERROR',
      }
    }

    const supabase = await createClient()

    // 1. Verificar sesión activa
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        message: 'Sesión no válida o expirada. Por favor, vuelve a iniciar sesión.',
        code: 'UNAUTHORIZED',
      }
    }

    // 2. Actualizar perfil de cuenta en public.profiles
    const cleanDisplayName = displayName?.trim() || playerName.trim()
    const { data: updatedProfile, error: profileErr } = await supabase
      .from('profiles')
      .update({
        display_name: cleanDisplayName,
        avatar_url: avatarUrl || null,
      })
      .eq('id', user.id)
      .select()
      .single()

    if (profileErr) {
      return handleActionError(profileErr, 'No se pudo actualizar el perfil de usuario.')
    }

    // Sincronizar metadatos de auth
    await supabase.auth.updateUser({
      data: { display_name: cleanDisplayName },
    })

    // 3. Buscar o asegurar registro de jugador
    let existingPlayerId: string | null = null
    const { data: foundPlayer } = await supabase
      .from('players')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (foundPlayer) {
      existingPlayerId = foundPlayer.id
    }

    let savedPlayer: Player

    if (existingPlayerId) {
      // Actualizar jugador existente
      const { data: updatedPlayerData, error: playerUpdateErr } = await supabase
        .from('players')
        .update({
          name: playerName.trim(),
          steam_id: steamId?.trim() || null,
          avatar_url: avatarUrl || null,
          clan_id: clanId || null,
        })
        .eq('id', existingPlayerId)
        .select()
        .single()

      if (playerUpdateErr) {
        return handleActionError(playerUpdateErr, 'No se pudo actualizar los datos del jugador.')
      }
      savedPlayer = updatedPlayerData as Player
    } else {
      // Insertar nuevo jugador
      const { data: newPlayerData, error: playerInsertErr } = await supabase
        .from('players')
        .insert({
          user_id: user.id,
          name: playerName.trim(),
          steam_id: steamId?.trim() || null,
          avatar_url: avatarUrl || null,
          clan_id: clanId || null,
        })
        .select()
        .single()

      if (playerInsertErr) {
        return handleActionError(playerInsertErr, 'No se pudo registrar el jugador para esta cuenta.')
      }
      savedPlayer = newPlayerData as Player
    }

    revalidatePath('/profile')
    revalidatePath('/')

    return handleActionSuccess(
      '¡Tus datos de cuenta e información del jugador fueron actualizados con éxito!',
      {
        profile: updatedProfile as Profile,
        player: savedPlayer,
      }
    )
  } catch (criticalError: unknown) {
    console.error('[CRITICAL saveProfileAction error]:', criticalError)
    return {
      success: false,
      message: 'Ocurrió un error inesperado en el servidor al guardar el perfil.',
      code: 'SERVER_EXCEPTION',
    }
  }
}
