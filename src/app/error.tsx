'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'

interface ErrorBoundaryProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    // Registro del error en consola para depuración segura del lado del cliente
    console.error('[Application Error Boundary caught error]:', error)
  }, [error])

  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          maxWidth: '560px',
          background: 'var(--bg-dark-1)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '3rem 2rem',
          boxShadow: 'var(--shadow-card)',
          position: 'relative',
        }}
      >
        {/* Icono Lambda de Alerta */}
        <div
          className="lambda-icon"
          style={{
            margin: '0 auto 1.5rem auto',
            width: '48px',
            height: '48px',
            fontSize: '1.6rem',
            background: 'linear-gradient(135deg, #ef4444 0%, #991b1b 100%)',
            color: '#fff',
            boxShadow: '0 0 20px rgba(239, 68, 68, 0.4)',
          }}
        >
          !
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '2.4rem',
            lineHeight: 1.1,
            color: '#fff',
            letterSpacing: '0.04em',
            marginBottom: '0.75rem',
          }}
        >
          INTERRUPCIÓN EN LA TRANSMISIÓN
        </h1>

        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.95rem',
            color: 'var(--text-muted)',
            lineHeight: 1.5,
            marginBottom: '2rem',
          }}
        >
          Ocurrió un fallo inesperado al cargar los datos en el servidor.
          Los sistemas de seguridad de Black Mesa han contenido la excepción para proteger la integridad de la plataforma.
        </p>

        {error.digest && (
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              color: 'var(--text-dim)',
              marginBottom: '1.75rem',
            }}
          >
            Código de seguimiento: <code>{error.digest}</code>
          </p>
        )}

        {/* Acciones para reintentar o volver al lobby */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <button
            type="button"
            onClick={() => reset()}
            className="btn-join"
            style={{ fontSize: '1.1rem', padding: '0.65rem 1.8rem' }}
          >
            <span>🔄 Reintentar Carga</span>
          </button>

          <Link
            href="/"
            className="auth-toggle-link"
            style={{
              fontSize: '1rem',
              padding: '0.65rem 1rem',
            }}
          >
            ← Volver al Lobby
          </Link>
        </div>
      </div>
    </div>
  )
}
