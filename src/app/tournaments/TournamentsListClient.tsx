'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import type { Tournament, Player } from '@/types/models'

interface TournamentsListClientProps {
  initialTournaments: Tournament[]
  enrolledTournamentIds: string[]
  participantCounts: Record<string, number>
  currentPlayer: Player | null
}

const PAGE_SIZE = 20

type StatusFilter = 'all' | 'ongoing' | 'registration_open' | 'upcoming' | 'completed' | 'enrolled'
type TypeFilter = 'all' | 'league' | 'team' | 'individual'
type SortOption = 'date_asc' | 'date_desc' | 'prize_desc' | 'title_asc'

export function TournamentsListClient({
  initialTournaments,
  enrolledTournamentIds,
  participantCounts,
  currentPlayer,
}: TournamentsListClientProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [sortOption, setSortOption] = useState<SortOption>('date_asc')
  const [currentPage, setCurrentPage] = useState(1)

  // Conjunto de IDs inscritos para búsqueda O(1)
  const enrolledSet = useMemo(
    () => new Set(enrolledTournamentIds),
    [enrolledTournamentIds]
  )

  // Filtrado y ordenación
  const filteredTournaments = useMemo(() => {
    return initialTournaments.filter((tournament) => {
      // 1. Filtro de búsqueda por texto
      if (searchTerm.trim() !== '') {
        const query = searchTerm.trim().toLowerCase()
        const matchesTitle = tournament.title.toLowerCase().includes(query)
        const matchesMode = tournament.game_mode?.toLowerCase().includes(query)
        const matchesDesc = tournament.description?.toLowerCase().includes(query)
        if (!matchesTitle && !matchesMode && !matchesDesc) {
          return false
        }
      }

      // 2. Filtro por estado / inscritos
      if (statusFilter === 'enrolled') {
        if (!enrolledSet.has(tournament.id)) return false
      } else if (statusFilter !== 'all') {
        if (tournament.status !== statusFilter) return false
      }

      // 3. Filtro por tipo de torneo (league, team, individual)
      if (typeFilter !== 'all') {
        if (tournament.tournament_type !== typeFilter) return false
      }

      return true
    })
  }, [initialTournaments, searchTerm, statusFilter, typeFilter, enrolledSet])

  // Ordenación de la lista
  const sortedTournaments = useMemo(() => {
    const list = [...filteredTournaments]

    list.sort((a, b) => {
      if (sortOption === 'date_asc') {
        return new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
      }
      if (sortOption === 'date_desc') {
        return new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
      }
      if (sortOption === 'prize_desc') {
        return (Number(b.prize_pool_amount) || 0) - (Number(a.prize_pool_amount) || 0)
      }
      if (sortOption === 'title_asc') {
        return a.title.localeCompare(b.title)
      }
      return 0
    })

    return list
  }, [filteredTournaments, sortOption])

  // Paginación (máximo 20 por hoja)
  const totalItems = sortedTournaments.length
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE))

  // Asegurar que la página actual sea válida
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalItems)
  const paginatedTournaments = sortedTournaments.slice(startIndex, endIndex)

  // Contadores para las pestañas de estado
  const statusCounts = useMemo(() => {
    return {
      all: initialTournaments.length,
      ongoing: initialTournaments.filter((t) => t.status === 'ongoing').length,
      registration_open: initialTournaments.filter((t) => t.status === 'registration_open').length,
      upcoming: initialTournaments.filter((t) => t.status === 'upcoming').length,
      completed: initialTournaments.filter((t) => t.status === 'completed').length,
      enrolled: initialTournaments.filter((t) => enrolledSet.has(t.id)).length,
    }
  }, [initialTournaments, enrolledSet])

  // Handlers para cambiar filtros (resetean a página 1)
  function handleStatusChange(status: StatusFilter) {
    setStatusFilter(status)
    setCurrentPage(1)
  }

  function handleTypeChange(type: TypeFilter) {
    setTypeFilter(type)
    setCurrentPage(1)
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchTerm(e.target.value)
    setCurrentPage(1)
  }

  function handleResetFilters() {
    setSearchTerm('')
    setStatusFilter('all')
    setTypeFilter('all')
    setSortOption('date_asc')
    setCurrentPage(1)
  }

  // Ayudantes de formateo
  function formatPrize(amount: number | null, currency: string | null) {
    if (!amount) return 'Por Definir'
    const symbol = currency === 'USD' ? '$' : 'S/.'
    return `${symbol} ${Number(amount).toLocaleString('es-PE', { minimumFractionDigits: 0 })}`
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr)
    return d.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case 'ongoing':
        return { label: 'En Vivo', class: 'ongoing', icon: '🟢' }
      case 'registration_open':
        return { label: 'Inscripciones Abiertas', class: 'registration_open', icon: '🟡' }
      case 'upcoming':
        return { label: 'Próximo', class: 'upcoming', icon: '🔵' }
      case 'completed':
        return { label: 'Finalizado', class: 'completed', icon: '⚪' }
      default:
        return { label: status, class: 'upcoming', icon: '•' }
    }
  }

  function getTypeBadge(type: string) {
    switch (type) {
      case 'league':
        return {
          label: 'Formato Liga',
          icon: '🏆',
          isLeague: true,
          tooltip: 'Tabla acumulativa por fechas y puntos (Round Robin)',
        }
      case 'team':
        return {
          label: 'Equipos (Clanes)',
          icon: '🛡️',
          isLeague: false,
          tooltip: 'Enfrentamientos de clanes 5v5 o 2v2',
        }
      case 'individual':
      default:
        return {
          label: 'Duelo 1v1',
          icon: '⚡',
          isLeague: false,
          tooltip: 'Combate individual 1v1 en arena',
        }
    }
  }

  return (
    <div className="tournaments-page">
      <div className="tournaments-container">
        {/* Cabecera Principal */}
        <div className="tournaments-header">
          <div className="tournaments-header-left">

            <h1 className="tournaments-title">Torneos</h1>
            <p className="tournaments-subtitle">
              Explora los torneos oficiales y comunitarios de Half-Life. Participa en duelos individuales 1v1 o contra clanes
            </p>
          </div>

          <Link href="/tournaments/new" className="btn-create-tournament">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Crear Torneo</span>
          </Link>
        </div>

        {/* Panel de Filtros */}
        <div className="tournaments-filter-box">
          {/* Fila 1: Pestañas de Estado */}
          <div className="filter-status-row">
            <button
              type="button"
              className={`filter-tab-btn ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => handleStatusChange('all')}
            >
              <span>Todos los Torneos</span>
              <span className="filter-tab-count">{statusCounts.all}</span>
            </button>

            <button
              type="button"
              className={`filter-tab-btn ${statusFilter === 'ongoing' ? 'active' : ''}`}
              onClick={() => handleStatusChange('ongoing')}
            >
              <span>🟢 En Vivo (Activos)</span>
              <span className="filter-tab-count">{statusCounts.ongoing}</span>
            </button>

            <button
              type="button"
              className={`filter-tab-btn ${statusFilter === 'registration_open' ? 'active' : ''}`}
              onClick={() => handleStatusChange('registration_open')}
            >
              <span>🟡 Inscripciones Abiertas</span>
              <span className="filter-tab-count">{statusCounts.registration_open}</span>
            </button>

            <button
              type="button"
              className={`filter-tab-btn ${statusFilter === 'upcoming' ? 'active' : ''}`}
              onClick={() => handleStatusChange('upcoming')}
            >
              <span>🔵 Próximos</span>
              <span className="filter-tab-count">{statusCounts.upcoming}</span>
            </button>

            <button
              type="button"
              className={`filter-tab-btn ${statusFilter === 'completed' ? 'active' : ''}`}
              onClick={() => handleStatusChange('completed')}
            >
              <span>⚪ Finalizados</span>
              <span className="filter-tab-count">{statusCounts.completed}</span>
            </button>

            {currentPlayer && (
              <button
                type="button"
                className={`filter-tab-btn ${statusFilter === 'enrolled' ? 'active' : ''}`}
                onClick={() => handleStatusChange('enrolled')}
              >
                <span>⭐ Mis Inscripciones</span>
                <span className="filter-tab-count">{statusCounts.enrolled}</span>
              </button>
            )}
          </div>

          {/* Fila 2: Búsqueda, Filtro de Tipo y Ordenación */}
          <div className="filter-controls-row">
            {/* Buscador de texto */}
            <div className="search-input-wrapper">
              <svg
                className="search-input-icon"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className="search-input-field"
                placeholder="Buscar por título, mapa o modo (ej. Crossfire, Liga, 1v1)..."
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>

            {/* Selector de Tipo / Formato del Torneo */}
            <div className="filter-type-group">
              <button
                type="button"
                className={`type-pill-btn ${typeFilter === 'all' ? 'active' : ''}`}
                onClick={() => handleTypeChange('all')}
              >
                <span>Todos los Tipos</span>
              </button>

              <button
                type="button"
                className={`type-pill-btn type-pill-league ${typeFilter === 'league' ? 'active' : ''}`}
                onClick={() => handleTypeChange('league')}
                title="Nuevo formato de tabla regular por puntos"
              >
                <span>🏆 Formato Liga</span>
              </button>

              <button
                type="button"
                className={`type-pill-btn ${typeFilter === 'team' ? 'active' : ''}`}
                onClick={() => handleTypeChange('team')}
              >
                <span>🛡️ Por Equipos</span>
              </button>

              <button
                type="button"
                className={`type-pill-btn ${typeFilter === 'individual' ? 'active' : ''}`}
                onClick={() => handleTypeChange('individual')}
              >
                <span>⚡ 1v1 Individual</span>
              </button>
            </div>

            {/* Selector de Ordenación */}
            <div className="sort-select-wrapper">
              <span className="sort-select-label">ORDENAR POR:</span>
              <select
                className="sort-select"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
              >
                <option value="date_asc">Fecha: Próximos a iniciar</option>
                <option value="date_desc">Fecha: Más lejanos</option>
                <option value="prize_desc">Mayor Pozo de Premios</option>
                <option value="title_asc">Título (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Listado en Formato Lista */}
        {paginatedTournaments.length === 0 ? (
          <div className="tournaments-empty-card">
            <svg
              className="tournaments-empty-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
            <h3 className="tournaments-empty-title">No se encontraron torneos</h3>
            <p className="tournaments-empty-desc">
              No hay competiciones que coincidan con los filtros seleccionados o el término de búsqueda actual.
            </p>
            <button type="button" className="btn-reset-filters" onClick={handleResetFilters}>
              Restablecer Filtros
            </button>
          </div>
        ) : (
          <div className="tournaments-list-wrapper">
            {paginatedTournaments.map((tournament) => {
              const isEnrolled = enrolledSet.has(tournament.id)
              const statusInfo = getStatusLabel(tournament.status)
              const typeBadge = getTypeBadge(tournament.tournament_type)
              const participants = participantCounts[tournament.id] || 0
              const maxParticipants = tournament.max_participants || 16
              const progressPct = Math.min(100, Math.round((participants / maxParticipants) * 100))

              return (
                <div
                  key={tournament.id}
                  className={`tournament-row-item ${isEnrolled ? 'is-enrolled' : ''} ${tournament.tournament_type === 'league' ? 'is-league' : ''
                    }`}
                >
                  {/* Lado Izquierdo: Miniatura e Información Principal */}
                  <div className="tournament-row-left">
                    <div className="tournament-thumb-container">
                      <img
                        src={
                          tournament.banner_url ||
                          'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600'
                        }
                        alt={tournament.title}
                        className="tournament-thumb-img"
                        loading="lazy"
                      />
                      <span className="tournament-thumb-badge">HL1</span>
                    </div>

                    <div className="tournament-main-info">
                      {/* Badges de estado, formato e inscripción */}
                      <div className="tournament-tags-row">
                        <span className={`badge-tour-status ${statusInfo.class}`}>
                          <span>{statusInfo.icon}</span>
                          <span>{statusInfo.label}</span>
                        </span>

                        <span
                          className={`badge-tour-type ${typeBadge.isLeague ? 'badge-type-league' : ''}`}
                          title={typeBadge.tooltip}
                        >
                          <span>{typeBadge.icon}</span>
                          <span>{typeBadge.label}</span>
                        </span>

                        {isEnrolled && (
                          <span className="badge-enrolled-indicator">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <span>Inscrito</span>
                          </span>
                        )}
                      </div>

                      {/* Título del torneo */}
                      <h2 className="tournament-row-title">
                        <Link href={`/tournament/${tournament.id}`}>{tournament.title}</Link>
                      </h2>

                      {/* Metadata: Modo y Fechas */}
                      <div className="tournament-row-meta">
                        <span className="tournament-meta-item">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="12 2 2 7 12 12 22 7 12 2" />
                            <polyline points="2 17 12 22 22 17" />
                            <polyline points="2 12 12 17 22 12" />
                          </svg>
                          <span>{tournament.game_mode || 'Half-Life Deathmatch'}</span>
                        </span>

                        <span className="tournament-meta-item">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          <span>Inicia: {formatDate(tournament.start_date)}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Lado Derecho: Pozo, Participantes y Botón CTA */}
                  <div className="tournament-row-right">
                    {/* Pozo de Premios */}
                    <div className="tournament-metric-block">
                      <div className="tournament-metric-label">PREMIOS</div>
                      <div className="tournament-prize-amount">
                        {formatPrize(tournament.prize_pool_amount, tournament.prize_pool_currency)}
                      </div>
                    </div>

                    {/* Barra de Progreso de Participantes */}
                    <div className="tournament-participants-block">
                      <div className="tournament-participants-header">
                        <span>CUPOS</span>
                        <span>
                          {participants} / {maxParticipants}
                        </span>
                      </div>
                      <div className="tournament-progress-track">
                        <div
                          className="tournament-progress-fill"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Botón Ver Torneo */}
                    <Link href={`/tournament/${tournament.id}`} className="btn-view-tournament">
                      <span>Ver Torneo</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Barra de Paginación (Máximo 20 por página) */}
        {totalItems > 0 && (
          <div className="pagination-wrapper">
            <div className="pagination-info">
              Mostrando <strong style={{ color: '#fff' }}>{startIndex + 1}</strong> -{' '}
              <strong style={{ color: '#fff' }}>{endIndex}</strong> de{' '}
              <strong style={{ color: '#fb7e14' }}>{totalItems}</strong> torneos
            </div>

            <div className="pagination-controls">
              <button
                type="button"
                className="pagination-btn"
                disabled={safeCurrentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                aria-label="Página anterior"
              >
                &laquo;
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  className={`pagination-btn ${safeCurrentPage === page ? 'active' : ''}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                className="pagination-btn"
                disabled={safeCurrentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                aria-label="Página siguiente"
              >
                &raquo;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
