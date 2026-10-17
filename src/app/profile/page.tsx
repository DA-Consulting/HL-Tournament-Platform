'use client'

import React, { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import type { Profile, Player, Clan } from '@/types/models'
import { createAuthService } from '@/services/auth.service'
import { createPlayersService } from '@/services/players.service'
import { createClansService } from '@/services/clans.service'
import { Navbar } from '@/components/Navbar'

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [player, setPlayer] = useState<Player | null>(null)
  const [clans, setClans] = useState<Clan[]>([])
  const [loading, setLoading] = useState(true)

  // Campos de formulario editables
  const [displayName, setDisplayName] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [steamInput, setSteamInput] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [selectedClanId, setSelectedClanId] = useState<string>('')

  // Estados de retroalimentación
  const [steamLoading, setSteamLoading] = useState(false)
  const [steamMessage, setSteamMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isSaving, startTransition] = useTransition()

  useEffect(() => {
    async function loadUserData() {
      try {
        setLoading(true)
        const authService = createAuthService()
        const playersService = createPlayersService()
        const clansService = createClansService()

        // 1. Obtener usuario autenticado
        const { data: currentUser, error: userErr } = await authService.getUser()
        if (userErr || !currentUser) {
          router.push('/auth')
          return
        }
        setUser(currentUser)

        // 2. Obtener perfil
        const { data: userProfile } = await authService.getProfile(currentUser.id)
        if (userProfile) {
          setProfile(userProfile)
          setDisplayName(userProfile.display_name || '')
          if (userProfile.avatar_url) {
            setAvatarUrl(userProfile.avatar_url)
          }
        }

        // 3. Obtener o asegurar registro de Player para el usuario
        const defaultName =
          userProfile?.display_name ||
          currentUser.user_metadata?.display_name ||
          currentUser.email?.split('@')[0] ||
          'Jugador'

        let { data: playerRecord } = await playersService.getPlayerByUserId(currentUser.id)

        // Si no existe y no es admin, se crea automáticamente
        if (!playerRecord && userProfile?.role !== 'admin') {
          const ensured = await playersService.ensurePlayerForUser(currentUser.id, defaultName)
          playerRecord = ensured.data
        }

        if (playerRecord) {
          setPlayer(playerRecord)
          setPlayerName(playerRecord.name || defaultName)
          setSteamInput(playerRecord.steam_id || '')
          setSelectedClanId(playerRecord.clan_id || '')
          if (playerRecord.avatar_url) {
            setAvatarUrl(playerRecord.avatar_url)
          }
        } else {
          setPlayerName(defaultName)
        }

        // 4. Cargar lista de clanes para referencia
        const { data: clansData } = await clansService.getClans()
        if (clansData) {
          setClans(clansData)
        }
      } catch (err) {
        console.error('Error al cargar datos del perfil:', err)
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [router])

  /**
   * Consulta a la API de Steam para verificar el Steam ID y traer directamente
   * la foto de perfil oficial y el nombre de la persona desde Steam CDN.
   */
  async function handleSyncSteam() {
    if (!steamInput.trim()) {
      setSteamMessage({
        type: 'error',
        text: 'Por favor, ingresa tu SteamID64, enlace de perfil o vanity URL de Steam.',
      })
      return
    }

    setSteamLoading(true)
    setSteamMessage(null)

    try {
      const res = await fetch(`/api/steam/resolve?q=${encodeURIComponent(steamInput.trim())}`)
      const json = await res.json()

      if (!res.ok || !json.success || !json.data) {
        setSteamMessage({
          type: 'error',
          text:
            json.error ||
            'No se pudo encontrar el perfil de Steam. Asegúrate de que el perfil sea público y que el ID o URL sea correcto.',
        })
        return
      }

      const { steamId, personaName, avatarUrl: steamAvatar } = json.data

      // Actualizar campos con los datos traídos de Steam
      setSteamInput(steamId)
      if (steamAvatar) {
        setAvatarUrl(steamAvatar)
      }
      if (personaName && (!playerName || playerName === 'Jugador')) {
        setPlayerName(personaName)
      }

      setSteamMessage({
        type: 'success',
        text: `¡Cuenta de Steam vinculada exitosamente! Foto de perfil importada desde Steam CDN (${personaName || 'Jugador'}). Recuerda presionar "Guardar Cambios".`,
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al conectar con Steam'
      setSteamMessage({ type: 'error', text: msg })
    } finally {
      setSteamLoading(false)
    }
  }

  /**
   * Guarda las modificaciones realizadas tanto en el perfil como en la información del jugador.
   */
  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaveMessage(null)

    if (!playerName.trim()) {
      setSaveMessage({
        type: 'error',
        text: 'El nombre del jugador en el juego no puede estar vacío.',
      })
      return
    }

    startTransition(async () => {
      try {
        const authService = createAuthService()
        const playersService = createPlayersService()

        // 1. Actualizar perfil de cuenta
        const profileUpdateRes = await authService.updateProfile({
          displayName: displayName.trim(),
          avatarUrl: avatarUrl || undefined,
        })

        if (profileUpdateRes.error) {
          setSaveMessage({
            type: 'error',
            text: `Error al actualizar perfil: ${profileUpdateRes.error}`,
          })
          return
        }

        // 2. Actualizar o crear registro de jugador
        if (user) {
          let targetPlayerId = player?.id

          if (!targetPlayerId) {
            const created = await playersService.ensurePlayerForUser(user.id, playerName.trim())
            targetPlayerId = created.data?.id
          }

          if (targetPlayerId) {
            const playerUpdateRes = await playersService.updatePlayer(targetPlayerId, {
              name: playerName.trim(),
              steam_id: steamInput.trim() || null,
              avatar_url: avatarUrl || null,
              clan_id: selectedClanId || null,
            })

            if (playerUpdateRes.error) {
              setSaveMessage({
                type: 'error',
                text: `Error al actualizar información del jugador: ${playerUpdateRes.error}`,
              })
              return
            }

            if (playerUpdateRes.data) {
              setPlayer(playerUpdateRes.data)
            }
          }
        }

        setSaveMessage({
          type: 'success',
          text: '✓ ¡Tus datos de cuenta e información del jugador fueron actualizados con éxito!',
        })
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error inesperado al guardar los cambios'
        setSaveMessage({ type: 'error', text: msg })
      }
    })
  }

  /**
   * Cerrar sesión del usuario.
   */
  async function handleSignOut() {
    const authService = createAuthService()
    await authService.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="profile-page-wrapper" style={{ textAlign: 'center', paddingTop: '6rem' }}>
          <div className="lambda-icon" style={{ margin: '0 auto 1.5rem auto', transform: 'scale(1.3)' }}>
            λ
          </div>
          <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '2rem', color: 'var(--hl-orange)' }}>
            CARGANDO...
          </h2>
          <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            Consultando registros en la base de datos
          </p>
        </div>
      </>
    )
  }

  const assignedClan = clans.find((c) => c.id === selectedClanId)
  const isSteamLinked = Boolean(steamInput.trim() && avatarUrl)

  return (
    <>
      <Navbar />

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
              <h1>[{assignedClan ? assignedClan.name : 'Sin Clan'}] {playerName || displayName || 'Combatiente Half-Life'}</h1>
              <p className="profile-hero-email">
                {user?.email}
              </p>
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

        {/* Mensaje global de guardado */}
        {saveMessage && (
          <div
            className={
              saveMessage.type === 'success'
                ? 'auth-feedback-success'
                : 'auth-feedback-error'
            }
            style={{ marginBottom: '1.5rem' }}
          >
            <span>{saveMessage.type === 'success' ? '✓' : '⚠'}</span>
            <span>{saveMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleSave}>
          {/* Barra de Acciones y Guardado */}
          <div className="profile-actions-bar">
            <span></span>

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
    </>
  )
}
