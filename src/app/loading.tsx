import React from 'react'
import { Navbar } from '@/components/Navbar'

/**
 * Esqueleto de carga animado (Loading Skeleton) raíz para Next.js App Router.
 * Muestra placeholders para el carrusel hero y la sección de torneos principales.
 */
export default function RootLoading() {
  return (
    <>
      <Navbar />

      <main aria-busy="true" aria-label="Cargando plataforma de torneos...">
        {/* Carrusel Hero Skeleton */}
        <section className="hero-carousel-container" style={{ marginTop: '1.5rem' }}>
          <div
            className="carousel-frame skeleton-box animate-pulse"
            style={{
              height: '460px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              padding: '2.5rem',
            }}
          >
            <div
              className="skeleton-box"
              style={{ width: '130px', height: '24px', marginBottom: '1rem', background: 'rgba(255,255,255,0.1)' }}
            />
            <div
              className="skeleton-box"
              style={{ width: '450px', maxWidth: '90%', height: '48px', marginBottom: '1rem', background: 'rgba(255,255,255,0.1)' }}
            />
            <div
              className="skeleton-box"
              style={{ width: '300px', maxWidth: '75%', height: '20px', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.08)' }}
            />
            <div
              className="skeleton-box"
              style={{ width: '180px', height: '46px', background: 'rgba(251,126,20,0.2)' }}
            />
          </div>
        </section>

        {/* Sección de Torneos Skeleton */}
        <section style={{ maxWidth: '1320px', margin: '2rem auto', padding: '0 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div className="skeleton-box animate-pulse" style={{ width: '220px', height: '32px' }} />
            <div className="skeleton-box animate-pulse" style={{ width: '150px', height: '36px' }} />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="skeleton-box animate-pulse"
                style={{
                  height: '240px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-subtle)',
                }}
              />
            ))}
          </div>
        </section>
      </main>
    </>
  )
}
