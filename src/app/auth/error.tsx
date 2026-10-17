'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Auth Error Boundary caught error]:', error)
  }, [error])

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card-container">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div className="lambda-icon" style={{ margin: '0 auto 1.5rem auto', background: '#ef4444' }}>
            !
          </div>
          <h2 className="auth-title">ERROR EN EL SERVICIO DE AUTENTICACIÓN</h2>
          <p className="auth-subtitle" style={{ marginBottom: '1.75rem' }}>
            No se pudo establecer la conexión con el proveedor de identidades. Por favor, intenta de nuevo.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => reset()}
              className="btn-join auth-submit-btn"
            >
              <span>Reintentar</span>
            </button>
            <Link href="/" className="auth-toggle-link" style={{ textAlign: 'center' }}>
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
