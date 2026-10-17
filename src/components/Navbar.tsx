'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'
import { createAuthService } from '@/services/auth.service'

interface NavbarProps {
  activeSection?: string
  onSectionClick?: (section: string) => void
}

export function Navbar({ activeSection = 'tournaments', onSectionClick }: NavbarProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const authService = createAuthService()

    // 1. Obtener usuario actual
    authService.getUser().then((res) => {
      setUser(res.data)
      setLoading(false)
    })

    // 2. Suscribirse a cambios de autenticación
    const { subscription } = authService.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

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

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Lado Izquierdo: Nombre de la página con icono Lambda */}
        <Link href="/" className="brand-logo">
          <span>
            Half Life / AG
          </span>
        </Link>

        {/* Lado Derecho: Secciones y Botón de Inicio de Sesión / Ver Perfil */}
        <div className="navbar-right">
          <button
            type="button"
            className={`nav-link ${activeSection === 'tournaments' ? 'active' : ''}`}
            onClick={() => handleNavClick('tournaments')}
          >
            <span>Torneos</span>
          </button>

          <button
            type="button"
            className={`nav-link ${activeSection === 'tournaments' ? 'active' : ''}`}
            onClick={() => handleNavClick('tournaments')}
          >
            <span>Clanes</span>
          </button>

          <button
            type="button"
            className={`nav-link ${activeSection === 'clans' ? 'active' : ''}`}
            onClick={() => handleNavClick('clans')}
          >
            <span>Comunidad</span>
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
            <Link href="/profile" className="btn-join">
              <span>Ver Perfil</span>
            </Link>
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
