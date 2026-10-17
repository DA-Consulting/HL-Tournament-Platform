'use client'

import React, { useState, useEffect, useTransition, useCallback } from 'react'
import Link from 'next/link'
import type { Clan, Player, Tournament, ClanWithMembers, PlayerWithClan } from '@/types/models'
import { createClansService } from '@/services/clans.service'
import { createPlayersService } from '@/services/players.service'
import { createTournamentsService } from '@/services/tournaments.service'
import { createTournamentAction } from '@/actions/tournaments.actions'
import { createClanAction } from '@/actions/clans.actions'
import { createPlayerAction } from '@/actions/players.actions'
import { Navbar } from '@/components/Navbar'
import { toast } from 'sonner'

// Datos de demostración iniciales de torneos peruanos de Half-Life
const MOCK_TOURNAMENTS: Tournament[] = [
  {
    id: '77aa1122-1111-4444-bbbb-000000000001',
    title: 'Copa Nacional Crossfire Perú 2026',
    description:
      'El torneo insignia de Half-Life en Perú. 16 clanes compiten en el búnker de Crossfire y Stalkyard por la gloria nacional y el pozo acumulado.',
    player_id: 'd3eeaa66-6a3c-4ef8-bb6d-6bb9bd380a44',
    status: 'ongoing',
    start_date: new Date(Date.now() - 86400000 * 2).toISOString(),
    end_date: new Date(Date.now() + 86400000 * 5).toISOString(),
    prize_pool_currency: 'PEN',
    prize_pool_amount: 3500.0,
    winner_player_id: null,
    tournament_type: 'team',
    banner_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1400',
    game_mode: 'HL Deathmatch 5v5 (Crossfire & Stalkyard)',
    max_participants: 16,
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '77aa1122-2222-4444-bbbb-000000000002',
    title: 'Torneo Relámpago Lambda 1v1',
    description:
      'Duelos hardcore 1v1 con Tau Cannon (Gauss), escopeta y revólver 357. Domina el tau jump y demuestra tus reflejos en arenas cerradas.',
    player_id: 'e4ddbb55-5b4d-4ef8-bb6d-6bb9bd380a55',
    status: 'registration_open',
    start_date: new Date(Date.now() + 86400000 * 3).toISOString(),
    end_date: new Date(Date.now() + 86400000 * 4).toISOString(),
    prize_pool_currency: 'USD',
    prize_pool_amount: 500.0,
    winner_player_id: null,
    tournament_type: 'individual',
    banner_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1400',
    game_mode: 'Half-Life 1v1 Arena',
    max_participants: 32,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '77aa1122-3333-4444-bbbb-000000000003',
    title: 'Adrenaline Gamer AG Masters Lima',
    description:
      'Competición de ritmo ultra rápido con bunnyhop avanzado y física competitiva AG. Diseñado para los jugadores más rápidos del país.',
    player_id: 'f5ccaa44-4c5e-4ef8-bb6d-6bb9bd380a66',
    status: 'upcoming',
    start_date: new Date(Date.now() + 86400000 * 12).toISOString(),
    end_date: new Date(Date.now() + 86400000 * 14).toISOString(),
    prize_pool_currency: 'PEN',
    prize_pool_amount: 2000.0,
    winner_player_id: null,
    tournament_type: 'team',
    banner_url: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1400',
    game_mode: 'Adrenaline Gamer 2v2',
    max_participants: 24,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date().toISOString(),
  },
]

const MOCK_CLANS: Clan[] = [
  {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    name: 'Black Mesa Squad Perú',
    owner_id: 'usr_freeman_001',
    photo_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'b1ffcd88-8b1a-4ef8-bb6d-6bb9bd380a22',
    name: 'Lambda Core Rebels Lima',
    owner_id: 'usr_calhoun_002',
    photo_url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'c2eedd77-7a2b-4ef8-bb6d-6bb9bd380a33',
    name: 'HEV Elite Division',
    owner_id: 'usr_shephard_003',
    photo_url: null,
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    updated_at: new Date().toISOString(),
  },
]

const MOCK_PLAYERS: PlayerWithClan[] = [
  {
    id: 'd3eeaa66-6a3c-4ef8-bb6d-6bb9bd380a44',
    user_id: null,
    name: 'Gordon Freeman [PE]',
    steam_id: 'STEAM_0:1:12345678',
    avatar_url: 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg',
    clan_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date().toISOString(),
    clan: MOCK_CLANS[0],
  },
  {
    id: 'e4ddbb55-5b4d-4ef8-bb6d-6bb9bd380a55',
    user_id: null,
    name: 'Barney Calhoun',
    steam_id: 'STEAM_0:0:87654321',
    avatar_url: null,
    clan_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date().toISOString(),
    clan: MOCK_CLANS[0],
  },
  {
    id: 'f5ccaa44-4c5e-4ef8-bb6d-6bb9bd380a66',
    user_id: null,
    name: 'Adrian Shephard',
    steam_id: 'STEAM_0:1:11223344',
    avatar_url: null,
    clan_id: 'b1ffcd88-8b1a-4ef8-bb6d-6bb9bd380a22',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date().toISOString(),
    clan: MOCK_CLANS[1],
  },
]

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'tournaments' | 'clans' | 'players' | 'sql' | 'docs'>('tournaments')
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [clans, setClans] = useState<Clan[]>([])
  const [players, setPlayers] = useState<PlayerWithClan[]>([])
  const [loading, setLoading] = useState(true)
  const [isLiveSupabase, setIsLiveSupabase] = useState(false)
  const [apiErrorMessage, setApiErrorMessage] = useState<string | null>(null)

  // Carrusel Hero
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isCarouselPaused, setIsCarouselPaused] = useState(false)

  // Filtros
  const [tournamentSearch, setTournamentSearch] = useState('')
  const [tournamentStatusFilter, setTournamentStatusFilter] = useState('all')
  const [tournamentTypeFilter, setTournamentTypeFilter] = useState('all')
  const [clanSearch, setClanSearch] = useState('')
  const [playerSearch, setPlayerSearch] = useState('')
  const [selectedClanFilter, setSelectedClanFilter] = useState('all')

  // Modales
  const [showCreateTournamentModal, setShowCreateTournamentModal] = useState(false)
  const [selectedTournamentDetails, setSelectedTournamentDetails] = useState<Tournament | null>(null)
  const [selectedClanDetails, setSelectedClanDetails] = useState<ClanWithMembers | null>(null)
  const [showCreateClanModal, setShowCreateClanModal] = useState(false)
  const [showCreatePlayerModal, setShowCreatePlayerModal] = useState(false)

  // Formulario de torneo
  const [newTourTitle, setNewTourTitle] = useState('')
  const [newTourDesc, setNewTourDesc] = useState('')
  const [newTourOrganizerId, setNewTourOrganizerId] = useState('')
  const [newTourStatus, setNewTourStatus] = useState('registration_open')
  const [newTourStartDate, setNewTourStartDate] = useState('')
  const [newTourEndDate, setNewTourEndDate] = useState('')
  const [newTourCurrency, setNewTourCurrency] = useState('PEN')
  const [newTourAmount, setNewTourAmount] = useState<number>(1000)
  const [newTourType, setNewTourType] = useState('team')
  const [newTourBanner, setNewTourBanner] = useState('')
  const [newTourGameMode, setNewTourGameMode] = useState('Half-Life: Deathmatch (Crossfire)')
  const [newTourMaxParticipants, setNewTourMaxParticipants] = useState<number>(16)

  // Formulario Clan
  const [newClanName, setNewClanName] = useState('')
  const [newClanOwner, setNewClanOwner] = useState('')
  const [newClanPhoto, setNewClanPhoto] = useState('')

  // Formulario Jugador
  const [newPlayerName, setNewPlayerName] = useState('')
  const [newPlayerSteamId, setNewPlayerSteamId] = useState('')
  const [newPlayerClanId, setNewPlayerClanId] = useState('')

  const [isPending, startTransition] = useTransition()
  const [copiedSql, setCopiedSql] = useState(false)

  // Carga inicial
  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    setApiErrorMessage(null)

    const tournamentsService = createTournamentsService()
    const clansService = createClansService()
    const playersService = createPlayersService()

    try {
      const [tourRes, clansRes, playersRes] = await Promise.all([
        tournamentsService.getTournaments(),
        clansService.getClans(),
        playersService.getPlayersWithClan(),
      ])

      if (tourRes.data && !tourRes.error) {
        setTournaments(tourRes.data.length > 0 ? tourRes.data : MOCK_TOURNAMENTS)
        setIsLiveSupabase(true)
      } else {
        setTournaments(MOCK_TOURNAMENTS)
        setIsLiveSupabase(false)
        if (tourRes.error) setApiErrorMessage(tourRes.error)
      }

      if (clansRes.data && !clansRes.error) {
        setClans(clansRes.data.length > 0 ? clansRes.data : MOCK_CLANS)
      } else {
        setClans(MOCK_CLANS)
      }

      if (playersRes.data && !playersRes.error) {
        setPlayers(playersRes.data.length > 0 ? playersRes.data : MOCK_PLAYERS)
      } else {
        setPlayers(MOCK_PLAYERS)
      }
    } catch {
      setTournaments(MOCK_TOURNAMENTS)
      setClans(MOCK_CLANS)
      setPlayers(MOCK_PLAYERS)
      setIsLiveSupabase(false)
    } finally {
      setLoading(false)
    }
  }

  // Torneos para el carrusel
  const carouselTournaments = tournaments.slice(0, 4)

  // Rotación del Carrusel
  const nextSlide = useCallback(() => {
    if (carouselTournaments.length === 0) return
    setCurrentSlide((prev) => (prev + 1) % carouselTournaments.length)
  }, [carouselTournaments.length])

  const prevSlide = useCallback(() => {
    if (carouselTournaments.length === 0) return
    setCurrentSlide((prev) => (prev - 1 + carouselTournaments.length) % carouselTournaments.length)
  }, [carouselTournaments.length])

  useEffect(() => {
    if (isCarouselPaused || carouselTournaments.length === 0) return
    const interval = setInterval(() => {
      nextSlide()
    }, 6000)
    return () => clearInterval(interval)
  }, [isCarouselPaused, nextSlide, carouselTournaments.length])

  // Filtrado de torneos
  const filteredTournaments = tournaments.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(tournamentSearch.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(tournamentSearch.toLowerCase()))

    if (!matchesSearch) return false
    if (tournamentStatusFilter !== 'all' && t.status !== tournamentStatusFilter) return false
    if (tournamentTypeFilter !== 'all' && t.tournament_type !== tournamentTypeFilter) return false

    return true
  })

  // Filtrado de clanes
  const filteredClans = clans.filter((c) =>
    c.name.toLowerCase().includes(clanSearch.toLowerCase()) ||
    c.owner_id.toLowerCase().includes(clanSearch.toLowerCase())
  )

  // Filtrado de jugadores
  const filteredPlayers = players.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(playerSearch.toLowerCase()) ||
      (p.steam_id ? p.steam_id.toLowerCase().includes(playerSearch.toLowerCase()) : false)

    if (!matchesSearch) return false
    if (selectedClanFilter === 'all') return true
    if (selectedClanFilter === 'unassigned') return p.clan_id === null
    return p.clan_id === selectedClanFilter
  })

  // Crear Torneo
  async function handleCreateTournament(e: React.FormEvent) {
    e.preventDefault()
    if (!newTourTitle.trim() || !newTourStartDate) {
      toast.error('Datos incompletos', {
        description: 'El título y la fecha de inicio del torneo son obligatorios.',
      })
      return
    }

    const defaultOrganizer = players[0]?.id || 'd3eeaa66-6a3c-4ef8-bb6d-6bb9bd380a44'

    startTransition(async () => {
      const response = await createTournamentAction({
        title: newTourTitle.trim(),
        description: newTourDesc.trim() || null,
        player_id: newTourOrganizerId || defaultOrganizer,
        status: newTourStatus,
        start_date: new Date(newTourStartDate).toISOString(),
        end_date: newTourEndDate ? new Date(newTourEndDate).toISOString() : null,
        prize_pool_currency: newTourCurrency,
        prize_pool_amount: Number(newTourAmount) || 0,
        tournament_type: newTourType,
        banner_url:
          newTourBanner.trim() ||
          'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1400',
        game_mode: newTourGameMode,
        max_participants: Number(newTourMaxParticipants) || 16,
      })

      if (!response.success) {
        toast.error('Error al registrar torneo', {
          description: response.message,
        })
      } else {
        if (response.data) {
          setTournaments((prev) => [response.data!, ...prev])
        }
        toast.success('¡Torneo publicado con éxito!', {
          description: response.message,
        })
        setNewTourTitle('')
        setNewTourDesc('')
        setShowCreateTournamentModal(false)
      }
    })
  }

  // Crear Clan
  async function handleCreateClan(e: React.FormEvent) {
    e.preventDefault()
    if (!newClanName.trim() || !newClanOwner.trim()) {
      toast.error('Datos incompletos', {
        description: 'El nombre del clan y el ID del líder son obligatorios.',
      })
      return
    }

    startTransition(async () => {
      const response = await createClanAction({
        name: newClanName.trim(),
        owner_id: newClanOwner.trim(),
        photo_url: newClanPhoto.trim() || null,
      })

      if (!response.success) {
        toast.error('Error al fundar clan', {
          description: response.message,
        })
      } else {
        if (response.data) {
          setClans((prev) => [response.data!, ...prev])
        }
        toast.success('¡Clan fundado con éxito!', {
          description: response.message,
        })
        setNewClanName('')
        setNewClanOwner('')
        setNewClanPhoto('')
        setShowCreateClanModal(false)
      }
    })
  }

  // Crear Jugador
  async function handleCreatePlayer(e: React.FormEvent) {
    e.preventDefault()
    if (!newPlayerName.trim() || !newPlayerSteamId.trim()) {
      toast.error('Datos incompletos', {
        description: 'El nombre del combatiente y su Steam ID son obligatorios.',
      })
      return
    }

    startTransition(async () => {
      const response = await createPlayerAction({
        name: newPlayerName.trim(),
        steam_id: newPlayerSteamId.trim(),
        clan_id: newPlayerClanId || null,
      })

      const assignedClan = clans.find((c) => c.id === newPlayerClanId) || null

      if (!response.success) {
        toast.error('Error al registrar combatiente', {
          description: response.message,
        })
      } else {
        if (response.data) {
          setPlayers((prev) => [{ ...response.data!, clan: assignedClan }, ...prev])
        }
        toast.success('¡Combatiente reclutado!', {
          description: response.message,
        })
        setNewPlayerName('')
        setNewPlayerSteamId('')
        setNewPlayerClanId('')
        setShowCreatePlayerModal(false)
      }
    })
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'ongoing':
        return <span className="badge badge-status-ongoing">● EN VIVO</span>
      case 'registration_open':
        return <span className="badge badge-status-open">⚡ INSCRIPCIÓN ABIERTA</span>
      case 'upcoming':
        return <span className="badge badge-status-upcoming">⏳ PRÓXIMAMENTE</span>
      case 'completed':
        return <span className="badge badge-status-completed">✓ FINALIZADO</span>
      default:
        return <span className="badge badge-type">{status}</span>
    }
  }

  function formatPrize(amount: number | null, currency: string | null) {
    if (!amount || amount === 0) return 'Sin premio'
    const cur = currency === 'USD' ? '$' : 'S/.'
    return `${cur} ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
  }

  return (
    <>
      {/* =====================================================================
          1. NAVBAR (Con estado dinámico: Iniciar sesión / Ver Perfil)
          ===================================================================== */}
      <Navbar
        activeSection={activeTab}
        onSectionClick={(sec) => {
          setActiveTab(sec as any)
          const el = document.getElementById(`${sec}-section`)
          if (el) el.scrollIntoView({ behavior: 'smooth' })
        }}
      />

      {/* =====================================================================
          2. HERO CAROUSEL (Debajo del Navbar)
          ===================================================================== */}
      <section
        className="hero-carousel-container"
        onMouseEnter={() => setIsCarouselPaused(true)}
        onMouseLeave={() => setIsCarouselPaused(false)}
        aria-label="Torneos Destacados"
      >
        <div className="carousel-frame">
          {carouselTournaments.map((tour, idx) => (
            <div
              key={tour.id}
              className={`carousel-slide ${idx === currentSlide ? 'active' : ''}`}
            >
              {/* Imagen de Fondo */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  tour.banner_url ||
                  'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1400'
                }
                alt={tour.title}
                className="carousel-bg-image"
              />

              {/* Contenido / Superposición */}
              <div className="carousel-overlay">
                <div className="carousel-badges">
                  {getStatusBadge(tour.status)}
                  <span className="badge badge-prize">
                    💰 {formatPrize(tour.prize_pool_amount, tour.prize_pool_currency)}
                  </span>
                  <span className="badge badge-type">
                    {tour.tournament_type === 'team' ? '👥 En Equipos' : '👤 Solo'}
                  </span>
                  {tour.game_mode && (
                    <span className="badge badge-type" style={{ borderColor: 'var(--border-accent)' }}>
                      🎮 {tour.game_mode}
                    </span>
                  )}
                </div>

                <h1 className="carousel-title">{tour.title}</h1>
                <p className="carousel-description">{tour.description}</p>

                <div className="carousel-meta-row">
                  <div className="carousel-meta-item">
                    <span>📅 Inicio:</span>
                    <strong style={{ color: '#fff' }}>
                      {new Date(tour.start_date).toLocaleDateString('es-PE', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </strong>
                  </div>
                  {tour.max_participants && (
                    <div className="carousel-meta-item">
                      <span>👥 Cupos:</span>
                      <strong style={{ color: '#fff' }}>{tour.max_participants} participantes</strong>
                    </div>
                  )}
                  <div className="carousel-meta-item">
                    <span>🇵🇪 Región:</span>
                    <strong style={{ color: 'var(--hl-orange)' }}>Perú (Servidores Lima)</strong>
                  </div>
                </div>

                <div className="carousel-actions">
                  <button
                    className="btn-join"
                    onClick={() => setSelectedTournamentDetails(tour)}
                  >
                    <span>🎯</span> Inscribirse / Ver Torneo
                  </button>
                  <button
                    className="btn-secondary-action"
                    onClick={() => {
                      setActiveTab('tournaments')
                      const el = document.getElementById('tournaments-section')
                      if (el) el.scrollIntoView({ behavior: 'smooth' })
                    }}
                  >
                    Explorar Torneos
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Botones de navegación (Flechas) */}
          <button
            className="carousel-btn prev"
            onClick={prevSlide}
            aria-label="Torneo anterior"
          >
            ❮
          </button>
          <button
            className="carousel-btn next"
            onClick={nextSlide}
            aria-label="Siguiente torneo"
          >
            ❯
          </button>

          {/* Indicadores de diapositivas */}
          <div className="carousel-indicators">
            {carouselTournaments.map((_, idx) => (
              <button
                key={idx}
                className={`indicator-dot ${idx === currentSlide ? 'active' : ''}`}
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Ir al torneo ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </section>



      {/* =====================================================================
          MODAL: DETALLES DEL TORNEO
          ===================================================================== */}
      {selectedTournamentDetails && (
        <div className="modal-overlay" onClick={() => setSelectedTournamentDetails(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.3rem', color: '#fff' }}>
                {selectedTournamentDetails.title}
              </h3>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setSelectedTournamentDetails(null)}
              >
                ✕ Cerrar
              </button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              {getStatusBadge(selectedTournamentDetails.status)}
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: '1.6' }}>
              {selectedTournamentDetails.description || 'Sin descripción adicional.'}
            </p>

            <div className="card-fields" style={{ marginBottom: '1.5rem' }}>
              <div className="card-field-row">
                <span className="card-field-label">Pozo del Torneo</span>
                <span className="card-field-value" style={{ color: 'var(--hl-orange)', fontWeight: 800 }}>
                  {formatPrize(
                    selectedTournamentDetails.prize_pool_amount,
                    selectedTournamentDetails.prize_pool_currency
                  )}
                </span>
              </div>
              <div className="card-field-row">
                <span className="card-field-label">Modalidad</span>
                <span className="card-field-value">
                  {selectedTournamentDetails.tournament_type === 'team' ? '5v5 Equipos' : '1v1 Duelos'}
                </span>
              </div>
              <div className="card-field-row">
                <span className="card-field-label">Modo / Mapas</span>
                <span className="card-field-value">{selectedTournamentDetails.game_mode}</span>
              </div>
              <div className="card-field-row">
                <span className="card-field-label">Fecha Inicio</span>
                <span className="card-field-value">
                  {new Date(selectedTournamentDetails.start_date).toLocaleString('es-PE')}
                </span>
              </div>
              {selectedTournamentDetails.end_date && (
                <div className="card-field-row">
                  <span className="card-field-label">Fecha Término</span>
                  <span className="card-field-value">
                    {new Date(selectedTournamentDetails.end_date).toLocaleString('es-PE')}
                  </span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                className="btn-join"
                onClick={() => {
                  alert(`¡Solicitud de inscripción enviada para: ${selectedTournamentDetails.title}!`)
                  setSelectedTournamentDetails(null)
                }}
              >
                🎮 Inscribir mi Clan / Jugador
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: CREAR TORNEO
          ===================================================================== */}
      {showCreateTournamentModal && (
        <div className="modal-overlay" onClick={() => setShowCreateTournamentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.3rem', color: '#fff' }}>🏆 Registrar Nuevo Torneo</h3>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowCreateTournamentModal(false)}
              >
                ✕ Cerrar
              </button>
            </div>

            <form onSubmit={handleCreateTournament}>
              <div className="form-group">
                <label className="form-label">Título del Torneo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Copa Crossfire Verano 2026"
                  value={newTourTitle}
                  onChange={(e) => setNewTourTitle(e.target.value)}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Descripción</label>
                <textarea
                  rows={3}
                  placeholder="Detalles de reglas, formato y mapas..."
                  value={newTourDesc}
                  onChange={(e) => setNewTourDesc(e.target.value)}
                  className="form-control"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Estado *</label>
                  <select
                    value={newTourStatus}
                    onChange={(e) => setNewTourStatus(e.target.value)}
                    className="form-control"
                  >
                    <option value="registration_open">Inscripción Abierta</option>
                    <option value="upcoming">Próximamente</option>
                    <option value="ongoing">En Vivo</option>
                    <option value="completed">Finalizado</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Tipo de Torneo *</label>
                  <select
                    value={newTourType}
                    onChange={(e) => setNewTourType(e.target.value)}
                    className="form-control"
                  >
                    <option value="team">Equipos (Team)</option>
                    <option value="individual">Individual (1v1)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Moneda del Pozo</label>
                  <select
                    value={newTourCurrency}
                    onChange={(e) => setNewTourCurrency(e.target.value)}
                    className="form-control"
                  >
                    <option value="PEN">PEN (Soles)</option>
                    <option value="USD">USD (Dólares)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Monto del Premio</label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={newTourAmount}
                    onChange={(e) => setNewTourAmount(Number(e.target.value))}
                    className="form-control"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Fecha de Inicio *</label>
                  <input
                    type="datetime-local"
                    required
                    value={newTourStartDate}
                    onChange={(e) => setNewTourStartDate(e.target.value)}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Fecha de Fin (Opcional)</label>
                  <input
                    type="datetime-local"
                    value={newTourEndDate}
                    onChange={(e) => setNewTourEndDate(e.target.value)}
                    className="form-control"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Modo de Juego / Mapas</label>
                <input
                  type="text"
                  placeholder="Ej: Half-Life 5v5 (Crossfire / Boot Camp)"
                  value={newTourGameMode}
                  onChange={(e) => setNewTourGameMode(e.target.value)}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Banner URL (Imagen para el Carrusel)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newTourBanner}
                  onChange={(e) => setNewTourBanner(e.target.value)}
                  className="form-control"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateTournamentModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-join" disabled={isPending}>
                  {isPending ? 'Guardando...' : 'Guardar Torneo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Ver Miembros del Clan */}
      {selectedClanDetails && (
        <div className="modal-overlay" onClick={() => setSelectedClanDetails(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.3rem', color: '#fff' }}>
                🛡️ Miembros de {selectedClanDetails.name}
              </h3>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setSelectedClanDetails(null)}
              >
                ✕ Cerrar
              </button>
            </div>

            {(!selectedClanDetails.players || selectedClanDetails.players.length === 0) ? (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <p>Este clan no tiene jugadores asignados actualmente.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {selectedClanDetails.players.map((member) => (
                  <div
                    key={member.id}
                    style={{
                      background: 'var(--bg-black)',
                      padding: '0.85rem 1.25rem',
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div>
                      <strong style={{ color: '#fff', fontSize: '0.95rem' }}>{member.name}</strong>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        {member.steam_id}
                      </div>
                    </div>
                    <span className="badge badge-type">Miembro</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Crear Clan */}
      {showCreateClanModal && (
        <div className="modal-overlay" onClick={() => setShowCreateClanModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.3rem', color: '#fff' }}>🛡️ Registrar Nuevo Clan</h3>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowCreateClanModal(false)}
              >
                ✕ Cerrar
              </button>
            </div>

            <form onSubmit={handleCreateClan}>
              <div className="form-group">
                <label className="form-label">Nombre del Clan *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Black Mesa Squad"
                  value={newClanName}
                  onChange={(e) => setNewClanName(e.target.value)}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Owner ID *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: usr_admin_123"
                  value={newClanOwner}
                  onChange={(e) => setNewClanOwner(e.target.value)}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Photo URL (Opcional)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newClanPhoto}
                  onChange={(e) => setNewClanPhoto(e.target.value)}
                  className="form-control"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateClanModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-join" disabled={isPending}>
                  {isPending ? 'Guardando...' : 'Crear Clan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Crear Jugador */}
      {showCreatePlayerModal && (
        <div className="modal-overlay" onClick={() => setShowCreatePlayerModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.3rem', color: '#fff' }}>🎮 Registrar Jugador</h3>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowCreatePlayerModal(false)}
              >
                ✕ Cerrar
              </button>
            </div>

            <form onSubmit={handleCreatePlayer}>
              <div className="form-group">
                <label className="form-label">Nombre del Jugador *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Gordon Freeman"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Steam ID *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: STEAM_0:1:98765432"
                  value={newPlayerSteamId}
                  onChange={(e) => setNewPlayerSteamId(e.target.value)}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Clan Asociado (Opcional)</label>
                <select
                  value={newPlayerClanId}
                  onChange={(e) => setNewPlayerClanId(e.target.value)}
                  className="form-control"
                >
                  <option value="">Sin clan (Agente Libre)</option>
                  {clans.map((clan) => (
                    <option key={clan.id} value={clan.id}>
                      {clan.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreatePlayerModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-join" disabled={isPending}>
                  {isPending ? 'Guardando...' : 'Registrar Jugador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
