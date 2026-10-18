import React from 'react'
import { Navbar } from '@/components/Navbar'

/**
 * Esqueleto de carga animado (Loading Skeleton) para la ruta /profile.
 * Aprovecha el streaming nativo de Next.js (App Router) y React Suspense.
 */
export default function ProfileLoading() {
  return (
    <>
      <Navbar />

      <main className="profile-page-wrapper" aria-busy="true" aria-label="Cargando perfil...">
        {/* Breadcrumb Skeleton */}
        <div className="profile-breadcrumb" style={{ marginBottom: '1.5rem' }}>
          <div
            className="skeleton-box animate-pulse"
            style={{ width: '140px', height: '16px', borderRadius: '4px' }}
          />
        </div>

        {/* Hero Card Skeleton: Avatar + Nombre del jugador */}
        <div className="profile-hero-card">
          <div className="profile-hero-main" style={{ width: '100%' }}>
            {/* Placeholder para foto/avatar de perfil */}
            <div className="skeleton-avatar skeleton-box animate-pulse" />

            {/* Placeholder para nombre del jugador, email y badges */}
            <div className="profile-hero-info" style={{ flex: 1 }}>
              {/* Nombre del jugador */}
              <div className="skeleton-box skeleton-text-title animate-pulse" />

              {/* Email del usuario */}
              <div className="skeleton-box skeleton-text-sub animate-pulse" />

              {/* Badges de rol y estado de Steam */}
              <div className="profile-hero-tags" style={{ display: 'flex', gap: '0.6rem' }}>
                <div
                  className="skeleton-box skeleton-badge animate-pulse"
                  style={{ width: '130px' }}
                />
                <div
                  className="skeleton-box skeleton-badge animate-pulse"
                  style={{ width: '100px' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Barra de Acciones Skeleton */}
        <div className="profile-actions-bar">
          <span />
          <div
            className="skeleton-box skeleton-button animate-pulse"
            style={{ width: '190px', height: '48px' }}
          />
        </div>
      </main>
    </>
  )
}
