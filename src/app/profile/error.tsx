'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'

export default function ProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Profile Error Boundary caught error]:', error)
  }, [error])

  return (
    <>
      <Navbar />
      <div className="profile-page-wrapper" style={{ textAlign: 'center', paddingTop: '5rem' }}>
        <div className="lambda-icon" style={{ margin: '0 auto 1.5rem auto', background: '#ef4444' }}>
          !
        </div>
        <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '2.2rem', color: '#fff', letterSpacing: '0.03em' }}>
          NO SE PUDO CARGAR EL PERFIL
        </h2>
        <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '2rem' }}>
          Ocurrió una interrupción al consultar los registros del combatiente en Supabase.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button type="button" onClick={() => reset()} className="btn-join">
            <span>Reintentar</span>
          </button>
          <Link href="/" className="auth-toggle-link" style={{ alignSelf: 'center', fontSize: '1rem' }}>
            ← Volver al Lobby
          </Link>
        </div>
      </div>
    </>
  )
}
