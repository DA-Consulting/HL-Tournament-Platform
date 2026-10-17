'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  type ActionResponse,
  handleActionError,
  handleActionSuccess,
} from '@/lib/action-response'
import type { Clan, ClanInsert, ClanUpdate } from '@/types/models'

/**
 * Server Action para fundar / registrar un clan.
 */
export async function createClanAction(
  clanData: ClanInsert
): Promise<ActionResponse<Clan>> {
  try {
    if (!clanData.name?.trim()) {
      return {
        success: false,
        message: 'El nombre del clan es obligatorio.',
        code: 'VALIDATION_ERROR',
      }
    }

    if (!clanData.owner_id?.trim()) {
      return {
        success: false,
        message: 'El identificador del líder (owner) del clan es obligatorio.',
        code: 'VALIDATION_ERROR',
      }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('clans')
      .insert({
        name: clanData.name.trim(),
        owner_id: clanData.owner_id.trim(),
        photo_url: clanData.photo_url?.trim() || null,
      })
      .select()
      .single()

    if (error) {
      return handleActionError(error, 'No se pudo registrar el clan.')
    }

    revalidatePath('/')
    return handleActionSuccess(
      `¡Clan "${data.name}" fundado y registrado con éxito!`,
      data as Clan
    )
  } catch (criticalError: unknown) {
    console.error('[CRITICAL createClanAction error]:', criticalError)
    return {
      success: false,
      message: 'Ocurrió un error inesperado al registrar el clan en el servidor.',
      code: 'SERVER_EXCEPTION',
    }
  }
}

/**
 * Server Action para actualizar un clan existente.
 */
export async function updateClanAction(
  id: string,
  updates: ClanUpdate
): Promise<ActionResponse<Clan>> {
  try {
    if (!id) {
      return {
        success: false,
        message: 'Identificador de clan no especificado.',
        code: 'VALIDATION_ERROR',
      }
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('clans')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return handleActionError(error, 'No se pudo actualizar el clan.')
    }

    revalidatePath('/')
    return handleActionSuccess('Clan actualizado correctamente.', data as Clan)
  } catch (criticalError: unknown) {
    console.error('[CRITICAL updateClanAction error]:', criticalError)
    return {
      success: false,
      message: 'Fallo al actualizar el clan en el servidor.',
      code: 'SERVER_EXCEPTION',
    }
  }
}

/**
 * Server Action para eliminar un clan.
 */
export async function deleteClanAction(
  id: string
): Promise<ActionResponse<boolean>> {
  try {
    if (!id) {
      return {
        success: false,
        message: 'Identificador de clan no especificado.',
        code: 'VALIDATION_ERROR',
      }
    }

    const supabase = await createClient()
    const { error } = await supabase.from('clans').delete().eq('id', id)

    if (error) {
      return handleActionError(error, 'No se pudo eliminar el clan.')
    }

    revalidatePath('/')
    return handleActionSuccess('Clan eliminado correctamente.', true)
  } catch (criticalError: unknown) {
    console.error('[CRITICAL deleteClanAction error]:', criticalError)
    return {
      success: false,
      message: 'Error al intentar eliminar el clan en el servidor.',
      code: 'SERVER_EXCEPTION',
    }
  }
}
