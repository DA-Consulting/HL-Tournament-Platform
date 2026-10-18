'use client'

import React, { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { Profile, Player, Clan } from '@/types/models'
import { saveProfileAction } from '@/actions/players.actions'
import { logoutAction } from '@/actions/auth.actions'

interface ProfileClientProps {
  user: { id: string; email: string }
  initialProfile: Profile | null
  initialPlayer: Player | null
  clans: Clan[]
}

export function ProfileClient({
  user,
  initialProfile,
  initialPlayer,
  clans,
}: ProfileClientProps) {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(initialProfile)
  const [player, setPlayer] = useState<Player | null>(initialPlayer)

  // Inicialización directa y síncrona sin useState vacíos ni useEffect para carga inicial
  const [displayName, setDisplayName] = useState(initialProfile?.display_name || '')
  const [playerName, setPlayerName] = useState(
    initialPlayer?.name || initialProfile?.display_name || 'Combatiente Half-Life'
  )
  const [steamInput, setSteamInput] = useState(initialPlayer?.steam_id || '')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    initialPlayer?.avatar_url || initialProfile?.avatar_url || null
  )
  const [selectedClanId, setSelectedClanId] = useState<string>(initialPlayer?.clan_id || '')

  const [steamLoading, setSteamLoading] = useState(false)
  const [isSaving, startTransition] = useTransition()

  const assignedClan = clans.find((c) => c.id === selectedClanId)
  const isSteamLinked = Boolean(steamInput.trim() && avatarUrl)

  /**
   * Consulta a la API de Steam para verificar el Steam ID y traer directamente
   * la foto de perfil oficial y el nombre de la persona desde Steam CDN.
   */
  async function handleSyncSteam() {
    if (!steamInput.trim()) {
      toast.error('Campo requerido', {
        description: 'Por favor, ingresa tu SteamID64, enlace de perfil o vanity URL de Steam.',
      })
      return
    }

    setSteamLoading(true)

    const syncPromise = (async () => {
      const res = await fetch(`/api/steam/resolve?q=${encodeURIComponent(steamInput.trim())}`)
      const json = await res.json()

      if (!res.ok || !json.success || !json.data) {
        throw new Error(
          json.error ||
          'No se pudo encontrar el perfil de Steam. Asegúrate de que el perfil sea público y que el ID o URL sea correcto.'
        )
      }

      const { steamId, personaName, avatarUrl: steamAvatar } = json.data

      setSteamInput(steamId)
      if (steamAvatar) {
        setAvatarUrl(steamAvatar)
      }
      if (personaName && (!playerName || playerName === 'Combatiente Half-Life')) {
        setPlayerName(personaName)
      }

      return json.data
    })()

    toast.promise(syncPromise, {
      loading: 'Consultando servidores de Steam...',
      success: (data) =>
        `¡Cuenta de Steam vinculada! Foto importada (${data.personaName || 'Jugador'}). Recuerda guardar los cambios.`,
      error: (err) => {
        return err instanceof Error ? err.message : 'Error al conectar con Steam'
      },
      finally: () => {
        setSteamLoading(false)
      },
    })
  }

  /**
   * Guarda las modificaciones realizadas tanto en el perfil como en la información del jugador
   * utilizando la Server Action saveProfileAction con el contrato unificado ActionResponse.
   */
  async function handleSave(e: React.FormEvent) {
    e.preventDefault()

    if (!playerName.trim()) {
      toast.error('Campo obligatorio', {
        description: 'El nombre del jugador en el juego no puede estar vacío.',
      })
      return
    }

    startTransition(async () => {
      const response = await saveProfileAction({
        displayName: displayName.trim(),
        playerName: playerName.trim(),
        steamId: steamInput.trim() || null,
        avatarUrl: avatarUrl || null,
        clanId: selectedClanId || null,
      })

      if (!response.success) {
        toast.error('Error al guardar cambios', {
          description: response.message,
        })
      } else {
        toast.success('¡Éxito!', {
          description: response.message,
        })
        if (response.data) {
          setProfile(response.data.profile)
          setPlayer(response.data.player)
        }
      }
    })
  }

  /**
   * Cerrar sesión del usuario utilizando logoutAction.
   */
  async function handleSignOut() {
    const response = await logoutAction()

    if (!response.success) {
      toast.error('Error al cerrar sesión', {
        description: response.message,
      })
    } else {
      toast.success('Sesión finalizada', {
        description: response.message,
      })
      router.push('/')
    }
  }

  return (
    <main className="profile-page-wrapper">
      {/* Breadcrumb de Navegación */}
      <div className="profile-breadcrumb">
        <Link href="/">Inicio</Link>
        <span>/</span>
        <span>Mi Perfil</span>
      </div>

      {/* =====================================================================
          1. HERO / TARJETA PRINCIPAL DEL PERFIL
          ===================================================================== */}
      <div className="profile-hero-card">
        <div className="profile-hero-main">
          {/* Foto de Perfil Oficial Traída desde Steam */}
          <div className="profile-avatar-container">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={`Avatar de ${playerName || displayName}`}
                className="profile-avatar-img"
              />
            ) : (
              <div className="profile-avatar-fallback">λ</div>
            )}
            <div className="profile-avatar-badge">
              {isSteamLinked ? 'Steam Avatar' : 'Sin Steam'}
            </div>
          </div>

          {/* Datos Resumidos */}
          <div className="profile-hero-info">
            <h1>
              [{assignedClan ? assignedClan.name : 'Sin Clan'}]{' '}
              {playerName || displayName || 'Combatiente Half-Life'}
            </h1>
            <p className="profile-hero-email">{user.email}</p>
            <div className="profile-hero-tags">
              {isSteamLinked ? (
                <span className="badge-tag badge-tag-steam-linked">
                  ✓ STEAM VINCULADO
                </span>
              ) : (
                <span className="badge-tag badge-tag-steam-pending">
                  ⚠ STEAM PENDIENTE
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave}>
        {/* Barra de Acciones y Guardado */}
        <div className="profile-actions-bar">
          <span />

          <button
            type="submit"
            disabled={isSaving}
            className="btn-join"
            style={{ padding: '0.8rem 2.5rem', fontSize: '1.2rem' }}
          >
            <span>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
          </button>
        </div>
      </form>
    </main>
  )
}
