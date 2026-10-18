'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { createAuthService } from '@/services/auth.service'
import { createPlayersService } from '@/services/players.service'
import { logoutAction } from '@/actions/auth.actions'
import { toast } from 'sonner'
import type { Player } from '@/types/models'

interface NavbarProps {
  activeSection?: string
  onSectionClick?: (section: string) => void
}

export function Navbar({ activeSection = 'tournaments', onSectionClick }: NavbarProps) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [player, setPlayer] = useState<Player | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const authService = createAuthService()
    const playersService = createPlayersService()

    // 1. Obtener usuario actual y su registro de jugador
    authService.getUser().then(async (res) => {
      const currentUser = res.data
      setUser(currentUser)
      if (currentUser) {
        const playerRes = await playersService.getPlayerByUserId(currentUser.id)
        setPlayer(playerRes.data)
      }
      setLoading(false)
    })

    // 2. Suscribirse a cambios de autenticación en tiempo real
    const { subscription } = authService.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        const playerRes = await playersService.getPlayerByUserId(currentUser.id)
        setPlayer(playerRes.data)
      } else {
        setPlayer(null)
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Manejar clics fuera del menú desplegable y tecla Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isDropdownOpen])

  function handleNavClick(section: string) {
    if (onSectionClick) {
      onSectionClick(section)
    } else {
      // Si estamos en otra página, redirigir al home con el ancla
      if (typeof window !== 'undefined' && window.location.pathname !== '/') {
        window.location.href = `/#${section}`
      } else {
        const el = document.getElementById(`${section}-section`)
        if (el) el.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }

  async function handleLogout() {
    setIsDropdownOpen(false)
    setIsLoggingOut(true)

    try {
      const res = await logoutAction()
      const authService = createAuthService()
      await authService.signOut()

      if (res.success) {
        toast.success('Has cerrado sesión correctamente.')
      } else {
        toast.error(res.message || 'Error al cerrar sesión.')
      }

      setUser(null)
      setPlayer(null)
      router.push('/')
      router.refresh()
    } catch {
      toast.error('Ocurrió un error inesperado al cerrar sesión.')
    } finally {
      setIsLoggingOut(false)
    }
  }

  // Nombre a mostrar en el botón
  const displayName =
    player?.name ||
    user?.user_metadata?.display_name ||
    user?.email?.split('@')[0] ||
    'Jugador'

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Lado Izquierdo: Nombre de la página con icono Lambda */}
        <Link href="/" className="brand-logo">
          <span>
            Half Life / AG
          </span>
        </Link>

        {/* Lado Derecho: Secciones y Botón de Inicio de Sesión / Menú de Jugador */}
        <div className="navbar-right">
          <Link
            href="/tournaments"
            className={`nav-link ${activeSection === 'tournaments' ? 'active' : ''}`}
          >
            <span>Torneos</span>
          </Link>

          <button
            type="button"
            className={`nav-link ${activeSection === 'clans' ? 'active' : ''}`}
            onClick={() => handleNavClick('clans')}
          >
            <span>Clanes</span>
          </button>

          <button
            type="button"
            className={`nav-link ${activeSection === 'players' ? 'active' : ''}`}
            onClick={() => handleNavClick('players')}
          >
            <span>Top Jugadores</span>
          </button>

          {/* Botón dinámico según el estado de la sesión */}
          {loading ? (
            <div className="btn-join btn-join-loading" style={{ opacity: 0.6 }}>
              <span>Cargando...</span>
            </div>
          ) : user ? (
            <div className="user-menu-container" ref={dropdownRef}>
              <button
                type="button"
                className={`btn-user-menu ${isDropdownOpen ? 'active' : ''}`}
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
                title={displayName}
              >
                {player?.avatar_url && (
                  <img
                    src={player.avatar_url}
                    alt={displayName}
                    className="user-menu-avatar"
                  />
                )}
                <span className="user-menu-name">{displayName}</span>
                <svg
                  className={`user-menu-chevron ${isDropdownOpen ? 'open' : ''}`}
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {/* Menú Desplegable */}
              {isDropdownOpen && (
                <div className="user-dropdown-menu" role="menu">
                  {/* Ver Perfil */}
                  <Link
                    href="/profile"
                    className="user-dropdown-item"
                    role="menuitem"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span>Ver Perfil</span>
                  </Link>

                  {/* Mi clan */}
                  <Link
                    href="/clan"
                    className="user-dropdown-item"
                    role="menuitem"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    <span>Mi clan</span>
                  </Link>

                  <div className="user-dropdown-divider" />

                  {/* Cerrar sesión */}
                  <button
                    type="button"
                    className="user-dropdown-item user-dropdown-logout"
                    role="menuitem"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    <span>{isLoggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/auth" className="btn-join">
              <span>Iniciar sesión</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
