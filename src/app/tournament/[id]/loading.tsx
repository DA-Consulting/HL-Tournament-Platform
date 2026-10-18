import React from 'react'
import { Navbar } from '@/components/Navbar'

/**
 * Skeleton animado para la ruta /tournament/[id].
 * Aprovecha el streaming nativo de Next.js y React Suspense para mostrar
 * inmediatamente la estructura visual del torneo sin parpadeos.
 */
export default function TournamentDetailLoading() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-black)' }}>
      <Navbar activeSection="tournaments" />

      <main className="tournament-detail-container">
        {/* Banner Superior Skeleton */}
        <div
          className="tournament-detail-hero skeleton-box animate-pulse"
          style={{ minHeight: '380px', padding: '2.5rem' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <div className="skeleton-box" style={{ width: '150px', height: '36px', borderRadius: '6px' }} />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div className="skeleton-box" style={{ width: '100px', height: '28px', borderRadius: '6px' }} />
              <div className="skeleton-box" style={{ width: '90px', height: '28px', borderRadius: '6px' }} />
            </div>
          </div>

          <div style={{ maxWidth: '800px', marginBottom: '2rem' }}>
            <div
              className="skeleton-box"
              style={{ width: '70%', height: '44px', marginBottom: '1rem', borderRadius: '8px' }}
            />
            <div
              className="skeleton-box"
              style={{ width: '90%', height: '20px', marginBottom: '0.5rem', borderRadius: '4px' }}
            />
            <div
              className="skeleton-box"
              style={{ width: '60%', height: '20px', borderRadius: '4px' }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '1.5rem',
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div style={{ display: 'flex', gap: '2rem' }}>
              <div className="skeleton-box" style={{ width: '110px', height: '40px', borderRadius: '6px' }} />
              <div className="skeleton-box" style={{ width: '110px', height: '40px', borderRadius: '6px' }} />
              <div className="skeleton-box" style={{ width: '110px', height: '40px', borderRadius: '6px' }} />
            </div>
            <div className="skeleton-box" style={{ width: '200px', height: '46px', borderRadius: '8px' }} />
          </div>
        </div>

        {/* Rejilla dividida en 2 columnas */}
        <div className="tournament-split-grid">
          {/* Lado Izquierdo: Tabla de Posiciones e Inscritos */}
          <div className="tournament-card-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div className="skeleton-box" style={{ width: '240px', height: '28px', borderRadius: '6px' }} />
              <div className="skeleton-box" style={{ width: '80px', height: '24px', borderRadius: '9999px' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="skeleton-box animate-pulse"
                  style={{
                    height: '52px',
                    width: '100%',
                    borderRadius: '8px',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Lado Derecho: Últimas Partidas Jugadas */}
          <div className="tournament-card-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div className="skeleton-box" style={{ width: '220px', height: '28px', borderRadius: '6px' }} />
              <div className="skeleton-box" style={{ width: '70px', height: '24px', borderRadius: '6px' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="skeleton-box animate-pulse"
                  style={{
                    height: '110px',
                    width: '100%',
                    borderRadius: '10px',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
