'use client'

import React, { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type {
  TournamentWithDetails,
  TournamentPlayerWithPlayer,
  TournamentMatchWithPlayers,
  Player,
} from '@/types/models'
import { registerToTournamentAction } from '@/actions/tournaments.actions'

interface TournamentDetailClientProps {
  tournament: TournamentWithDetails
  initialPlayers: TournamentPlayerWithPlayer[]
  initialMatches: TournamentMatchWithPlayers[]
  currentUser: { id: string; email: string } | null
  currentPlayer: Player | null
  isRegisteredInitial: boolean
}

export function TournamentDetailClient({
  tournament,
  initialPlayers,
  initialMatches,
  currentUser,
  currentPlayer,
  isRegisteredInitial,
}: TournamentDetailClientProps) {
  const router = useRouter()
  const [players, setPlayers] = useState<TournamentPlayerWithPlayer[]>(initialPlayers)
  const [matches] = useState<TournamentMatchWithPlayers[]>(initialMatches)
  const [isEnrolled, setIsEnrolled] = useState<boolean>(isRegisteredInitial)
  const [playerSearch, setPlayerSearch] = useState<string>('')
  const [isPending, startTransition] = useTransition()

  // Formato de moneda
  function formatPrize(amount: number | null, currency: string | null) {
    if (!amount || amount === 0) return 'Sin pozo'
    const curr = currency || 'PEN'
    if (curr === 'PEN') return `S/. ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
    return `$ ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} ${curr}`
  }

  // Insignia de estado del torneo
  function getStatusBadge(status: string) {
    switch (status) {
      case 'ongoing':
        return <span className="badge badge-ongoing">🟢 En Curso</span>
      case 'registration_open':
        return <span className="badge badge-open">🟡 Inscripciones Abiertas</span>
      case 'upcoming':
        return <span className="badge badge-upcoming">🔵 Próximo</span>
      case 'completed':
        return <span className="badge badge-completed">⚪ Finalizado</span>
      case 'cancelled':
        return <span className="badge badge-cancelled">🔴 Cancelado</span>
      default:
        return <span className="badge">{status}</span>
    }
  }

  // Filtrado de la tabla de posiciones
  const filteredPlayers = players.filter((entry) => {
    const q = playerSearch.toLowerCase().trim()
    if (!q) return true
    const playerName = entry.player?.name?.toLowerCase() || ''
    const clanName = entry.player?.clan?.name?.toLowerCase() || ''
    const steamId = entry.player?.steam_id?.toLowerCase() || ''
    return playerName.includes(q) || clanName.includes(q) || steamId.includes(q)
  })

  // Manejar acción de inscripción
  async function handleEnroll() {
    if (!currentUser) {
      toast.info('Inicio de sesión requerido', {
        description: 'Debes iniciar sesión con tu cuenta para inscribirte en el torneo.',
        action: {
          label: 'Iniciar sesión',
          onClick: () => router.push('/auth'),
        },
      })
      return
    }

    if (!currentPlayer?.steam_id) {
      toast.warning('Vinculación de Steam necesaria', {
        description: 'Para competir debes ingresar tu Steam ID en tu perfil de jugador.',
        action: {
          label: 'Ir a mi Perfil',
          onClick: () => router.push('/profile'),
        },
      })
      return
    }

    startTransition(async () => {
      const res = await registerToTournamentAction(tournament.id)

      if (!res.success) {
        toast.error('No se pudo completar la inscripción', {
          description: res.message,
        })
        return
      }

      toast.success('¡Inscripción confirmada!', {
        description: 'Has sido registrado en la lista de competidores oficiales.',
      })
      setIsEnrolled(true)

      // Actualizar la lista en tiempo real optimista si el jugador existe
      if (currentPlayer) {
        const newEntry: TournamentPlayerWithPlayer = {
          id: res.data?.id || 'temp-id',
          tournament_id: tournament.id,
          player_id: currentPlayer.id,
          score: 0,
          matches_played: 0,
          matches_won: 0,
          matches_lost: 0,
          status: 'confirmed',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          player: {
            ...currentPlayer,
            clan: null,
          },
        }
        setPlayers((prev) => [...prev, newEntry])
      }
    })
  }

  // Compartir enlace del torneo
  function handleShare() {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href)
      toast.success('¡Enlace copiado!', {
        description: 'El enlace directo al torneo fue copiado al portapapeles.',
      })
    }
  }

  const isFull = (tournament.max_participants || 16) <= players.length
  const isClosed = tournament.status === 'completed' || tournament.status === 'cancelled'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-black)' }}>
      <main className="tournament-detail-container">
        {/* ===================================================================
            BANNER SUPERIOR CON RESUMEN DEL TORNEO
            =================================================================== */}
        <section className="tournament-detail-hero">
          {/* Imagen de Fondo con Backdrop & Blur */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={
              tournament.banner_url ||
              'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1400'
            }
            alt={tournament.title}
            className="tournament-hero-backdrop"
          />
          <div className="tournament-hero-overlay" />

          <div className="tournament-hero-content">
            {/* Barra superior de navegación e insignias */}
            <div className="tournament-hero-top">
              <Link href="/" className="btn-back-link">
                <span>←</span> Volver a Torneos
              </Link>

              <div className="tournament-hero-badges">
                {getStatusBadge(tournament.status)}
                <span className="badge badge-type">
                  {tournament.tournament_type === 'team' ? '👥 5v5 Equipos' : '👤 1v1 Duelos'}
                </span>
                {tournament.game_mode && (
                  <span className="badge badge-type" style={{ borderColor: 'rgba(251, 126, 20, 0.4)' }}>
                    🎮 {tournament.game_mode}
                  </span>
                )}
              </div>
            </div>

            {/* Información principal: Título y Descripción */}
            <div className="tournament-hero-main">
              <h1 className="tournament-hero-title">{tournament.title}</h1>
              <p className="tournament-hero-desc">
                {tournament.description ||
                  'Enfrentamiento competitivo oficial de Half-Life en servidores de Lima, Perú. Demuestra tu puntería con Gauss y dominio del b-hop.'}
              </p>
            </div>

            {/* Fila de metadatos resumidos y botones de acción */}
            <div className="tournament-hero-meta-row">
              <div className="tournament-hero-chips">
                <div className="hero-chip">
                  <span className="hero-chip-label">💰 Pozo del Torneo</span>
                  <span className="hero-chip-val highlight-prize">
                    {formatPrize(tournament.prize_pool_amount, tournament.prize_pool_currency)}
                  </span>
                </div>

                <div className="hero-chip">
                  <span className="hero-chip-label">📅 Fecha de Inicio</span>
                  <span className="hero-chip-val">
                    {new Date(tournament.start_date).toLocaleDateString('es-PE', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                {tournament.end_date && (
                  <div className="hero-chip">
                    <span className="hero-chip-label">🏁 Fecha de Cierre</span>
                    <span className="hero-chip-val">
                      {new Date(tournament.end_date).toLocaleDateString('es-PE', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                )}

                <div className="hero-chip">
                  <span className="hero-chip-label">👥 Participantes</span>
                  <span className="hero-chip-val">
                    {players.length} / {tournament.max_participants || 16} Cupos
                  </span>
                </div>

                {tournament.organizer && (
                  <div className="hero-chip">
                    <span className="hero-chip-label">🛡️ Organizador</span>
                    <span className="hero-chip-val" style={{ color: 'var(--hl-orange)' }}>
                      {tournament.organizer.name}
                    </span>
                  </div>
                )}
              </div>

              {/* Botones de Acción */}
              <div className="tournament-hero-actions">
                {isEnrolled ? (
                  <div className="btn-enrolled-status">
                    <span>✓</span> Ya estás Inscrito
                  </div>
                ) : isClosed ? (
                  <div className="btn-enrolled-status" style={{ background: '#252525', color: '#999', borderColor: '#444' }}>
                    Torneo Cerrado
                  </div>
                ) : isFull ? (
                  <div className="btn-enrolled-status" style={{ background: '#3b2010', color: '#fb923c', borderColor: '#ea580c' }}>
                    Cupos Llenos
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn-join"
                    onClick={handleEnroll}
                    disabled={isPending}
                    style={{ opacity: isPending ? 0.7 : 1 }}
                  >
                    <span>🎯</span> {isPending ? 'Inscribiendo...' : 'Inscribirme en el Torneo'}
                  </button>
                )}

                <button
                  type="button"
                  className="btn-share-tournament"
                  onClick={handleShare}
                  title="Copiar enlace directo"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                  <span>Compartir</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================
            LAYOUT DIVIDIDO EN DOS COLUMNAS
            =================================================================== */}
        <div className="tournament-split-grid">
          {/* ---------------------------------------------------------------
              LADO IZQUIERDO: DETALLE DEL TORNEO, INSCRITOS Y ESTADÍSTICAS
              --------------------------------------------------------------- */}
          <div className="tournament-card-panel">
            <div className="panel-header">
              <div className="panel-title-wrap">
                <h2 className="panel-title">
                  Tabla de Posiciones e Inscritos
                </h2>
                <p className="panel-subtitle">
                  Rendimiento en tiempo real: puntajes acumulados, partidas ganadas y perdidas.
                </p>
              </div>

              <span className="panel-badge-count">
                {players.length} {players.length === 1 ? 'Inscrito' : 'Inscritos'}
              </span>
            </div>

            {/* Buscador de jugadores en el torneo */}
            <div style={{ marginBottom: '1.25rem' }}>
              <input
                type="text"
                placeholder="Buscar por jugador, clan o Steam ID..."
                value={playerSearch}
                onChange={(e) => setPlayerSearch(e.target.value)}
                className="form-control"
                style={{ fontSize: '0.88rem', padding: '0.55rem 0.85rem' }}
              />
            </div>

            {/* Tabla de Jugadores Inscritos */}
            <div className="standings-table-wrapper">
              {filteredPlayers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                  <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Sin participantes coincidentes</p>
                  <p style={{ fontSize: '0.85rem' }}>
                    {players.length === 0
                      ? 'Sé el primer combatiente en inscribirte en este torneo.'
                      : 'No se encontraron jugadores con el filtro especificado.'}
                  </p>
                </div>
              ) : (
                <table className="standings-table">
                  <thead>
                    <tr>
                      <th style={{ width: '45px' }}>#</th>
                      <th>Jugador</th>
                      <th style={{ textAlign: 'center' }}>PTS</th>
                      <th style={{ textAlign: 'center' }}>PJ</th>
                      <th style={{ textAlign: 'center' }}>PG</th>
                      <th style={{ textAlign: 'center' }}>PP</th>
                      <th style={{ textAlign: 'center' }}>% Vic</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPlayers.map((entry, idx) => {
                      const rank = idx + 1
                      const winRate =
                        entry.matches_played > 0
                          ? Math.round((entry.matches_won / entry.matches_played) * 100)
                          : 0

                      return (
                        <tr key={entry.id || entry.player_id}>
                          {/* Rango */}
                          <td>
                            <span
                              className={`rank-badge ${rank === 1
                                ? 'rank-1'
                                : rank === 2
                                  ? 'rank-2'
                                  : rank === 3
                                    ? 'rank-3'
                                    : 'rank-default'
                                }`}
                            >
                              {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
                            </span>
                          </td>

                          {/* Jugador y Clan */}
                          <td>
                            <div className="player-cell">
                              {entry.player?.avatar_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={entry.player.avatar_url}
                                  alt={entry.player.name}
                                  className="player-cell-avatar"
                                />
                              ) : (
                                <div className="player-cell-avatar-fallback">
                                  {entry.player?.name ? entry.player.name.charAt(0).toUpperCase() : 'λ'}
                                </div>
                              )}
                              <div className="player-cell-info">
                                <span className="player-cell-name">
                                  {entry.player?.name || 'Jugador Registrado'}
                                </span>
                                {entry.player?.clan?.name ? (
                                  <span className="player-cell-clan">
                                    [{entry.player.clan.name}]
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                                    {entry.player?.steam_id || 'Sin clan'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Puntaje */}
                          <td style={{ textAlign: 'center' }}>
                            <span className="standings-pts">{entry.score}</span>
                          </td>

                          {/* Partidas Jugadas */}
                          <td style={{ textAlign: 'center', color: '#e0e0e0', fontWeight: 600 }}>
                            {entry.matches_played}
                          </td>

                          {/* Partidas Ganadas */}
                          <td style={{ textAlign: 'center' }} className="stat-win">
                            {entry.matches_won}
                          </td>

                          {/* Partidas Perdidas */}
                          <td style={{ textAlign: 'center' }} className="stat-loss">
                            {entry.matches_lost}
                          </td>

                          {/* Porcentaje de Victoria */}
                          <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                            <span style={{ color: winRate >= 50 ? '#34d399' : '#a3a3a3' }}>
                              {winRate}%
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* ---------------------------------------------------------------
              LADO DERECHO: ÚLTIMAS PARTIDAS JUGADAS
              --------------------------------------------------------------- */}
          <div className="tournament-card-panel">
            <div className="panel-header">
              <div className="panel-title-wrap">
                <h2 className="panel-title">
                  Últimas Partidas Jugadas
                </h2>
                <p className="panel-subtitle">
                  Resultados recientes de enfrentamientos y marcador de frags.
                </p>
              </div>

              <span className="panel-badge-count">
                {matches.length} {matches.length === 1 ? 'Partida' : 'Partidas'}
              </span>
            </div>

            {matches.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '3rem 1.5rem',
                  background: 'var(--bg-black)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <h4 style={{ color: '#fff', fontSize: '1.05rem', marginBottom: '0.4rem' }}>
                  Aún no hay partidas disputadas
                </h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.5' }}>
                  Los emparejamientos y enfrentamientos se programarán al cerrarse la fase de
                  inscripciones. ¡Afina tu puntería en el búnker!
                </p>
              </div>
            ) : (
              <div className="matches-list">
                {matches.map((match) => {
                  const isPlayer1Winner = match.winner_player_id === match.player1_id
                  const isPlayer2Winner = match.winner_player_id === match.player2_id

                  return (
                    <article key={match.id} className="match-card">
                      {/* Cabecera de la partida */}
                      <div className="match-card-header">
                        <span style={{ fontWeight: 600, color: '#e0e0e0' }}>
                          {match.round_name || 'Fase Clasificatoria'}
                        </span>
                        <span className="match-map-badge">
                          🗺️ {match.map_name.toUpperCase()}
                        </span>
                      </div>

                      {/* Versus / Marcador */}
                      <div className="match-versus-container">
                        {/* Jugador 1 */}
                        <div className="match-fighter">
                          {match.player1?.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={match.player1.avatar_url}
                              alt={match.player1.name}
                              className="fighter-avatar"
                            />
                          ) : (
                            <div className="player-cell-avatar-fallback">
                              {match.player1?.name ? match.player1.name.charAt(0) : '1'}
                            </div>
                          )}
                          <div className="fighter-details">
                            <span
                              className={`fighter-name ${isPlayer1Winner ? 'is-winner' : ''}`}
                              title={match.player1?.name}
                            >
                              {match.player1?.name || 'Combatiente 1'}
                            </span>
                            <span className="fighter-clan">
                              {match.player1?.clan?.name || 'Independiente'}
                            </span>
                          </div>
                        </div>

                        {/* Marcador Central */}
                        <div className="match-score-badge">
                          <span className={`score-num ${isPlayer1Winner ? 'score-winner' : ''}`}>
                            {match.player1_score}
                          </span>
                          <span className="score-divider">-</span>
                          <span className={`score-num ${isPlayer2Winner ? 'score-winner' : ''}`}>
                            {match.player2_score}
                          </span>
                        </div>

                        {/* Jugador 2 */}
                        <div className="match-fighter fighter-right">
                          {match.player2?.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={match.player2.avatar_url}
                              alt={match.player2.name}
                              className="fighter-avatar"
                            />
                          ) : (
                            <div className="player-cell-avatar-fallback">
                              {match.player2?.name ? match.player2.name.charAt(0) : '2'}
                            </div>
                          )}
                          <div className="fighter-details">
                            <span
                              className={`fighter-name ${isPlayer2Winner ? 'is-winner' : ''}`}
                              title={match.player2?.name}
                            >
                              {match.player2?.name || 'Combatiente 2'}
                            </span>
                            <span className="fighter-clan">
                              {match.player2?.clan?.name || 'Independiente'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Pie de tarjeta con ganador */}
                      <div className="match-card-footer">
                        {match.winner ? (
                          <span className="match-winner-note">
                            👑 Victoria: {match.winner.name} (+3 PTS)
                          </span>
                        ) : (
                          <span>Marcador oficial registrado</span>
                        )}

                        {match.played_at && (
                          <span>
                            {new Date(match.played_at).toLocaleDateString('es-PE', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
