'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createTournamentAction } from '@/actions/tournaments.actions'
import type { Player, TournamentInsert } from '@/types/models'

interface CreateTournamentClientProps {
  currentPlayer: Player | null
}

const PRESET_BANNERS = [
  {
    name: 'Crossfire Bunker',
    url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1400',
  },
  {
    name: 'Stalkyard Arena',
    url: 'https://images.unsplash.com/photo-1542751110-97427bbecf20?w=1400',
  },
  {
    name: 'Boot Camp Military',
    url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1400',
  },
  {
    name: 'Bounce Gauss Arena',
    url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1400',
  },
  {
    name: 'Lambda Research Lab',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1400',
  },
  {
    name: 'Gasworks Industrial',
    url: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1400',
  },
]

export function CreateTournamentClient({ currentPlayer }: CreateTournamentClientProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  // Estados del formulario
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tournamentType, setTournamentType] = useState<'league' | 'team' | 'individual'>('league')
  const [gameMode, setGameMode] = useState('Half-Life: Deathmatch (Crossfire & Stalkyard)')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [prizeCurrency, setPrizeCurrency] = useState<'PEN' | 'USD'>('PEN')
  const [prizeAmount, setPrizeAmount] = useState('1500')
  const [maxParticipants, setMaxParticipants] = useState('16')
  const [status, setStatus] = useState<'registration_open' | 'upcoming'>('registration_open')
  const [bannerUrl, setBannerUrl] = useState(PRESET_BANNERS[0].url)
  const [customBannerUrl, setCustomBannerUrl] = useState('')

  // Opciones específicas de Formato Liga
  const [leagueFixtures, setLeagueFixtures] = useState('8')
  const [pointsPerWin, setPointsPerWin] = useState('3')
  const [pointsPerDraw, setPointsPerDraw] = useState('1')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!currentPlayer) {
      toast.error('Debes iniciar sesión con tu cuenta de jugador para crear un torneo.')
      return
    }

    if (!title.trim()) {
      toast.error('El título del torneo es requerido.')
      return
    }

    if (!startDate) {
      toast.error('Por favor especifica la fecha de inicio del torneo.')
      return
    }

    const finalBanner = customBannerUrl.trim() ? customBannerUrl.trim() : bannerUrl

    // Construcción de la descripción extendida para formato liga si aplica
    let finalDescription = description.trim()
    if (tournamentType === 'league') {
      const leagueRulesNotice = `\n\n[Reglas de Liga: ${leagueFixtures} Jornadas | Victoria: ${pointsPerWin} pts | Empate: ${pointsPerDraw} pts | Clasificación por Tabla Acumulada]`
      if (!finalDescription.includes('[Reglas de Liga')) {
        finalDescription += leagueRulesNotice
      }
    }

    const tournamentPayload: TournamentInsert = {
      title: title.trim(),
      description: finalDescription || null,
      player_id: currentPlayer.id,
      tournament_type: tournamentType,
      game_mode: gameMode.trim() || 'Half-Life: Deathmatch',
      start_date: new Date(startDate).toISOString(),
      end_date: endDate ? new Date(endDate).toISOString() : null,
      prize_pool_currency: prizeCurrency,
      prize_pool_amount: Number(prizeAmount) || 0,
      max_participants: Number(maxParticipants) || 16,
      status: status,
      banner_url: finalBanner,
    }

    setSubmitting(true)

    try {
      const res = await createTournamentAction(tournamentPayload)

      if (res.success && res.data) {
        toast.success(res.message || '¡Torneo creado exitosamente!')
        router.push(`/tournament/${res.data.id}`)
        router.refresh()
      } else {
        toast.error(res.message || 'No se pudo crear el torneo. Verifica los datos ingresados.')
      }
    } catch {
      toast.error('Ocurrió un error inesperado al procesar la creación del torneo.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="create-tournament-page">
      <div className="create-tournament-container">
        {/* Encabezado y Retorno */}
        <div className="create-tournament-header">
          <Link href="/tournaments" className="back-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span>Volver a Torneos</span>
          </Link>
          <h1 className="create-tournament-title">Crear Nuevo Torneo</h1>
          <p className="create-tournament-desc">
            Organiza tu propia competición en la plataforma. Configura duelos 1v1, batallas de clanes por equipos o
            estrena el nuevo <strong style={{ color: '#fb7e14' }}>Formato Liga</strong> con tabla clasificatoria por
            fechas.
          </p>
        </div>

        {/* Advertencia si no está autenticado */}
        {!currentPlayer && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              padding: '1.25rem',
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
            }}
          >
            <div>
              <strong style={{ color: '#f87171' }}>Sesión requerida:</strong>
              <p style={{ margin: '0.25rem 0 0', color: '#ccc', fontSize: '0.9rem' }}>
                Debes iniciar sesión con tu cuenta de jugador de Half-Life para poder publicar un torneo como
                organizador.
              </p>
            </div>
            <Link
              href="/auth"
              style={{
                background: '#f87171',
                color: '#111',
                fontWeight: 700,
                fontSize: '0.85rem',
                padding: '0.55rem 1.1rem',
                borderRadius: '4px',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              Iniciar Sesión
            </Link>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* SECCIÓN 1: TIPO Y FORMATO DE TORNEO (Destacando Formato Liga) */}
          <div className="form-card-section">
            <div className="form-section-header">
              <h2 className="form-section-title">
                <span>1. Formato de Competición</span>
              </h2>
              <p className="form-section-subtitle">
                Selecciona la modalidad de competencia. El formato de Liga es la novedad más reciente para clanes y
                jugadores regulares.
              </p>
            </div>

            <div className="format-selection-grid">
              {/* Opción 1: FORMATO LIGA (NUEVO) */}
              <div
                className={`format-card-option ${tournamentType === 'league' ? 'selected' : ''}`}
                onClick={() => setTournamentType('league')}
              >
                <span className="format-card-badge badge-new">¡Nuevo Formato!</span>
                <div className="format-card-icon">🏆</div>
                <h3 className="format-card-title">Formato Liga</h3>
                <p className="format-card-desc">
                  Campeonato por fechas continuas con tabla general de posiciones (Partidas Ganadas, Empates, Derrotas,
                  Frags y Puntos acumulados). Todos los participantes juegan múltiples jornadas sin eliminarse a la
                  primera ronda.
                </p>
                <div className="format-card-footer">Tabla Acumulativa + Fixtures</div>
              </div>

              {/* Opción 2: FORMATO EQUIPOS */}
              <div
                className={`format-card-option ${tournamentType === 'team' ? 'selected' : ''}`}
                onClick={() => setTournamentType('team')}
              >
                <div className="format-card-icon">🛡️</div>
                <h3 className="format-card-title">Equipos / Clanes</h3>
                <p className="format-card-desc">
                  Enfrentamientos tácticos de escuadrones 5v5 o 2v2. Ideal para batallas interclanes con fase de grupos o
                  eliminación directa en mapas competitivos.
                </p>
                <div className="format-card-footer">Clanes 5v5 / 2v2</div>
              </div>

              {/* Opción 3: FORMATO INDIVIDUAL */}
              <div
                className={`format-card-option ${tournamentType === 'individual' ? 'selected' : ''}`}
                onClick={() => setTournamentType('individual')}
              >
                <div className="format-card-icon">⚡</div>
                <h3 className="format-card-title">Duelo 1v1 Individual</h3>
                <p className="format-card-desc">
                  Combates individuales mano a mano en arenas clásicas de Half-Life o Adrenaline Gamer. Cuadros de
                  eliminación simple con armas clásicas.
                </p>
                <div className="format-card-footer">Arenas 1v1 Directas</div>
              </div>
            </div>

            {/* Callout especial interactivo cuando se selecciona Formato Liga */}
            {tournamentType === 'league' && (
              <div className="league-info-callout">
                <svg
                  className="league-callout-icon"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <div className="league-callout-content" style={{ flex: 1 }}>
                  <h4>¿Cómo funciona el Formato Liga en Half-Life?</h4>
                  <p>
                    A diferencia de los torneos de eliminación rápida donde una derrota te deja fuera, el formato Liga
                    organiza un calendario regular donde cada equipo o jugador suma puntos jornada tras jornada. La
                    clasificación se ordena por: <strong>Puntos</strong> &rarr; <strong>Victorias</strong> &rarr;{' '}
                    <strong>Diferencia de Frags</strong>.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', color: '#fb7e14', fontFamily: 'var(--font-mono)' }}>
                        Nº DE JORNADAS ESTIMADAS:
                      </label>
                      <input
                        type="number"
                        min="2"
                        max="24"
                        value={leagueFixtures}
                        onChange={(e) => setLeagueFixtures(e.target.value)}
                        className="form-input"
                        style={{ marginTop: '4px', padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', color: '#fb7e14', fontFamily: 'var(--font-mono)' }}>
                        PTS POR VICTORIA:
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        value={pointsPerWin}
                        onChange={(e) => setPointsPerWin(e.target.value)}
                        className="form-input"
                        style={{ marginTop: '4px', padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', color: '#fb7e14', fontFamily: 'var(--font-mono)' }}>
                        PTS POR EMPATE:
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="3"
                        value={pointsPerDraw}
                        onChange={(e) => setPointsPerDraw(e.target.value)}
                        className="form-input"
                        style={{ marginTop: '4px', padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECCIÓN 2: INFORMACIÓN GENERAL */}
          <div className="form-card-section">
            <div className="form-section-header">
              <h2 className="form-section-title">
                <span>2. Información General del Torneo</span>
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label className="form-label">TÍTULO DEL TORNEO *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="Ej: Copa Nacional Crossfire 2026, Liga Premier Apertura, etc."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label">MODO DE JUEGO / MAPAS *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="Ej: Half-Life 5v5 (Crossfire & Stalkyard) o Duelo 1v1 Gauss"
                  value={gameMode}
                  onChange={(e) => setGameMode(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label">DESCRIPCIÓN Y REGLAS</label>
                <textarea
                  className="form-input"
                  rows={4}
                  placeholder="Describe la dinámica, mapas permitidos, configuración del servidor (sv_gravity, mp_timelimit, etc.) y premios."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: PREMIOS, CUPOS Y ESTADO */}
          <div className="form-card-section">
            <div className="form-section-header">
              <h2 className="form-section-title">
                <span>3. Cupos, Fechas y Pozo de Premios</span>
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
              {/* Cupo Máximo */}
              <div>
                <label className="form-label">CUPO MÁXIMO DE PARTICIPANTES</label>
                <select
                  className="form-input"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(e.target.value)}
                >
                  <option value="8">8 Participantes</option>
                  <option value="12">12 Participantes</option>
                  <option value="16">16 Participantes (Recomendado)</option>
                  <option value="20">20 Participantes (Ideal Liga)</option>
                  <option value="24">24 Participantes</option>
                  <option value="32">32 Participantes</option>
                  <option value="64">64 Participantes</option>
                </select>
              </div>

              {/* Estado Inicial */}
              <div>
                <label className="form-label">ESTADO INICIAL DEL TORNEO</label>
                <select
                  className="form-input"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'registration_open' | 'upcoming')}
                >
                  <option value="registration_open">Inscripciones Abiertas (Activo para registrarse)</option>
                  <option value="upcoming">Próximamente (Anuncio previo)</option>
                </select>
              </div>

              {/* Moneda */}
              <div>
                <label className="form-label">MONEDA DEL PREMIO</label>
                <select
                  className="form-input"
                  value={prizeCurrency}
                  onChange={(e) => setPrizeCurrency(e.target.value as 'PEN' | 'USD')}
                >
                  <option value="PEN">Soles Peruanos (PEN - S/.)</option>
                  <option value="USD">Dólares Americanos (USD - $)</option>
                </select>
              </div>

              {/* Monto de Premio */}
              <div>
                <label className="form-label">MONTO DEL POZO DE PREMIOS</label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  className="form-input"
                  placeholder="Ej: 1500"
                  value={prizeAmount}
                  onChange={(e) => setPrizeAmount(e.target.value)}
                />
              </div>

              {/* Fecha de Inicio */}
              <div>
                <label className="form-label">FECHA Y HORA DE INICIO *</label>
                <input
                  type="datetime-local"
                  required
                  className="form-input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              {/* Fecha de Fin Estimada */}
              <div>
                <label className="form-label">FECHA DE CIERRE / FINAL ESTIMADA</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 4: BANNER DEL TORNEO */}
          <div className="form-card-section">
            <div className="form-section-header">
              <h2 className="form-section-title">
                <span>4. Portada / Banner del Torneo</span>
              </h2>
              <p className="form-section-subtitle">
                Elige una imagen temática oficial de Half-Life o ingresa tu propio enlace de portada.
              </p>
            </div>

            <div>
              <label className="form-label">PORTADAS PRECONFIGURADAS DE MAPAS CLÁSICOS</label>
              <div className="preset-banners-grid">
                {PRESET_BANNERS.map((preset) => (
                  <div
                    key={preset.name}
                    className={`preset-banner-item ${bannerUrl === preset.url && !customBannerUrl ? 'selected' : ''}`}
                    onClick={() => {
                      setBannerUrl(preset.url)
                      setCustomBannerUrl('')
                    }}
                  >
                    <img src={preset.url} alt={preset.name} className="preset-banner-img" />
                    <span className="preset-banner-label">{preset.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: '1.25rem' }}>
              <label className="form-label">O INGRESA UNA URL PERSONALIZADA</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://ejemplo.com/tu-banner.jpg"
                value={customBannerUrl}
                onChange={(e) => setCustomBannerUrl(e.target.value)}
              />
            </div>
          </div>

          {/* BARRA DE ACCIONES */}
          <div className="form-actions-bar">
            <Link href="/tournaments" className="btn-form-cancel">
              Cancelar
            </Link>

            <button
              type="submit"
              className="btn-form-submit"
              disabled={submitting || !currentPlayer}
            >
              {submitting ? (
                <>
                  <svg
                    style={{ animation: 'spin 1s linear infinite' }}
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
                  </svg>
                  <span>Publicando Torneo...</span>
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  <span>Publicar Torneo</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
