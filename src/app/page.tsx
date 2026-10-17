'use client'

import React, { useState, useEffect, useTransition } from 'react'
import type { Clan, Player, ClanWithMembers, PlayerWithClan } from '@/types/models'
import { createClansService } from '@/services/clans.service'
import { createPlayersService } from '@/services/players.service'

// Datos de demostración iniciales por si las credenciales de Supabase aún no se han configurado
const MOCK_CLANS: Clan[] = [
  {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    name: 'Black Mesa Squad',
    owner_id: 'usr_freeman_001',
    photo_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'b1ffcd88-8b1a-4ef8-bb6d-6bb9bd380a22',
    name: 'Lambda Core Rebels',
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
    name: 'Gordon F.',
    steam_id: 'STEAM_0:1:12345678',
    clan_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date().toISOString(),
    clan: MOCK_CLANS[0],
  },
  {
    id: 'e4ddbb55-5b4d-4ef8-bb6d-6bb9bd380a55',
    name: 'Barney C.',
    steam_id: 'STEAM_0:0:87654321',
    clan_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date().toISOString(),
    clan: MOCK_CLANS[0],
  },
  {
    id: 'f5ccaa44-4c5e-4ef8-bb6d-6bb9bd380a66',
    name: 'Adrian S.',
    steam_id: 'STEAM_0:1:11223344',
    clan_id: 'b1ffcd88-8b1a-4ef8-bb6d-6bb9bd380a22',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date().toISOString(),
    clan: MOCK_CLANS[1],
  },
  {
    id: '06bba933-3d6f-4ef8-bb6d-6bb9bd380a77',
    name: 'Eli Vance',
    steam_id: 'STEAM_0:0:99887766',
    clan_id: 'c2eedd77-7a2b-4ef8-bb6d-6bb9bd380a33',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date().toISOString(),
    clan: MOCK_CLANS[2],
  },
  {
    id: '17aa9822-2e7a-4ef8-bb6d-6bb9bd380a88',
    name: 'G-Man',
    steam_id: 'STEAM_0:1:00000001',
    clan_id: null,
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    updated_at: new Date().toISOString(),
    clan: null,
  },
]

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'clans' | 'players' | 'sql' | 'docs'>('clans')
  const [clans, setClans] = useState<Clan[]>([])
  const [players, setPlayers] = useState<PlayerWithClan[]>([])
  const [loading, setLoading] = useState(true)
  const [isLiveSupabase, setIsLiveSupabase] = useState(false)
  const [apiErrorMessage, setApiErrorMessage] = useState<string | null>(null)

  // Filtros
  const [clanSearch, setClanSearch] = useState('')
  const [playerSearch, setPlayerSearch] = useState('')
  const [selectedClanFilter, setSelectedClanFilter] = useState<string>('all')

  // Modal de detalles / creación
  const [selectedClanDetails, setSelectedClanDetails] = useState<ClanWithMembers | null>(null)
  const [showCreateClanModal, setShowCreateClanModal] = useState(false)
  const [showCreatePlayerModal, setShowCreatePlayerModal] = useState(false)

  // Formularios
  const [newClanName, setNewClanName] = useState('')
  const [newClanOwner, setNewClanOwner] = useState('')
  const [newClanPhoto, setNewClanPhoto] = useState('')

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

    const clansService = createClansService()
    const playersService = createPlayersService()

    try {
      const [clansRes, playersRes] = await Promise.all([
        clansService.getClans(),
        playersService.getPlayersWithClan(),
      ])

      if (clansRes.data && !clansRes.error) {
        setClans(clansRes.data)
        setIsLiveSupabase(true)
      } else {
        // Usar datos mockeados si Supabase aún no está conectado
        setClans(MOCK_CLANS)
        setIsLiveSupabase(false)
        if (clansRes.error) {
          setApiErrorMessage(clansRes.error)
        }
      }

      if (playersRes.data && !playersRes.error) {
        setPlayers(playersRes.data)
      } else {
        setPlayers(MOCK_PLAYERS)
      }
    } catch {
      setClans(MOCK_CLANS)
      setPlayers(MOCK_PLAYERS)
      setIsLiveSupabase(false)
    } finally {
      setLoading(false)
    }
  }

  // Filtrado de clanes
  const filteredClans = clans.filter((c) =>
    c.name.toLowerCase().includes(clanSearch.toLowerCase()) ||
    c.owner_id.toLowerCase().includes(clanSearch.toLowerCase())
  )

  // Filtrado de jugadores
  const filteredPlayers = players.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(playerSearch.toLowerCase()) ||
      p.steam_id.toLowerCase().includes(playerSearch.toLowerCase())

    if (!matchesSearch) return false

    if (selectedClanFilter === 'all') return true
    if (selectedClanFilter === 'unassigned') return p.clan_id === null
    return p.clan_id === selectedClanFilter
  })

  // Ver detalles de miembros de un clan
  async function handleViewClanMembers(clanId: string) {
    const clansService = createClansService()
    const res = await clansService.getClanWithMembers(clanId)
    if (res.data) {
      setSelectedClanDetails(res.data)
    } else {
      // Fallback con mock
      const clan = clans.find((c) => c.id === clanId)
      if (clan) {
        const clanPlayers = players.filter((p) => p.clan_id === clanId)
        setSelectedClanDetails({ ...clan, players: clanPlayers })
      }
    }
  }

  // Crear Clan
  async function handleCreateClan(e: React.FormEvent) {
    e.preventDefault()
    if (!newClanName.trim() || !newClanOwner.trim()) return

    const clansService = createClansService()
    startTransition(async () => {
      const res = await clansService.createClan({
        name: newClanName.trim(),
        owner_id: newClanOwner.trim(),
        photo_url: newClanPhoto.trim() || null,
      })

      if (res.data) {
        setClans((prev) => [res.data!, ...prev])
      } else {
        // Simulación local si Supabase no tiene llaves válidas aún
        const mockNew: Clan = {
          id: `clan-${Date.now()}`,
          name: newClanName.trim(),
          owner_id: newClanOwner.trim(),
          photo_url: newClanPhoto.trim() || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        setClans((prev) => [mockNew, ...prev])
      }

      setNewClanName('')
      setNewClanOwner('')
      setNewClanPhoto('')
      setShowCreateClanModal(false)
    })
  }

  // Crear Jugador
  async function handleCreatePlayer(e: React.FormEvent) {
    e.preventDefault()
    if (!newPlayerName.trim() || !newPlayerSteamId.trim()) return

    const playersService = createPlayersService()
    startTransition(async () => {
      const res = await playersService.createPlayer({
        name: newPlayerName.trim(),
        steam_id: newPlayerSteamId.trim(),
        clan_id: newPlayerClanId || null,
      })

      const assignedClan = clans.find((c) => c.id === newPlayerClanId) || null

      if (res.data) {
        setPlayers((prev) => [{ ...res.data!, clan: assignedClan }, ...prev])
      } else {
        const mockPlayer: PlayerWithClan = {
          id: `player-${Date.now()}`,
          name: newPlayerName.trim(),
          steam_id: newPlayerSteamId.trim(),
          clan_id: newPlayerClanId || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          clan: assignedClan,
        }
        setPlayers((prev) => [mockPlayer, ...prev])
      }

      setNewPlayerName('')
      setNewPlayerSteamId('')
      setNewPlayerClanId('')
      setShowCreatePlayerModal(false)
    })
  }

  const sqlSchemaCode = `-- ==============================================================================
-- Half-Life Tournament Platform: Schema DDL para Supabase
-- Tablas: clans y players con RLS e índices optimizados
-- ==============================================================================

create extension if not exists "uuid-ossp";

-- Trigger automático para updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 1. TABLA: clans
create table if not exists public.clans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id text not null,
  photo_url text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists idx_clans_name on public.clans(name);
create index if not exists idx_clans_owner_id on public.clans(owner_id);

drop trigger if exists set_clans_updated_at on public.clans;
create trigger set_clans_updated_at
  before update on public.clans
  for each row execute function public.handle_updated_at();

-- 2. TABLA: players
create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  steam_id text not null unique,
  clan_id uuid references public.clans(id) on delete set null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists idx_players_name on public.players(name);
create index if not exists idx_players_steam_id on public.players(steam_id);
create index if not exists idx_players_clan_id on public.players(clan_id);

drop trigger if exists set_players_updated_at on public.players;
create trigger set_players_updated_at
  before update on public.players
  for each row execute function public.handle_updated_at();

-- 3. POLÍTICAS ROW LEVEL SECURITY (RLS)
alter table public.clans enable row level security;
alter table public.players enable row level security;

create policy "Permitir lectura publica de clanes"
  on public.clans for select to anon, authenticated using (true);

create policy "Permitir lectura publica de jugadores"
  on public.players for select to anon, authenticated using (true);

create policy "Permitir insercion de clanes a usuarios autenticados"
  on public.clans for insert to authenticated with check (true);

create policy "Permitir insercion de jugadores a usuarios autenticados"
  on public.players for insert to authenticated with check (true);`

  function copySqlToClipboard() {
    navigator.clipboard.writeText(sqlSchemaCode)
    setCopiedSql(true)
    setTimeout(() => setCopiedSql(false), 2500)
  }

  return (
    <main className="container">
      {/* Header / Hero */}
      <header className="hero">
        <div className="hero-badge">
          <span>λ</span> Half-Life Tournament Platform
        </div>
        <h1 className="hero-title">Gestión de Clanes & Jugadores</h1>
        <p className="hero-subtitle">
          Arquitectura Next.js App Router con integración completa a Supabase, tipos TypeScript
          estrictos, servicios de consulta parametrizados y soporte para Server y Client Components.
        </p>
      </header>

      {/* Status Bar */}
      <section className="status-bar">
        <div className="status-indicator">
          <div className={`status-dot ${isLiveSupabase ? '' : 'warning'}`} />
          <div>
            <div className="status-text">
              {isLiveSupabase
                ? 'Conexión a Supabase activa (Live DB)'
                : 'Modo Entorno Local / Mock (Pendiente configurar .env.local)'}
            </div>
            <div className="status-meta">
              {isLiveSupabase
                ? 'Consultas ejecutándose contra la base de datos de Supabase'
                : 'Configura NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={fetchData} disabled={loading}>
            {loading ? 'Consultando...' : '🔄 Recargar Datos'}
          </button>
        </div>
      </section>

      {apiErrorMessage && !isLiveSupabase && (
        <div
          style={{
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            marginBottom: '2rem',
            fontSize: '0.875rem',
            color: '#fbbf24',
          }}
        >
          💡 <strong>Nota sobre la conexión:</strong> {apiErrorMessage}. Se muestran datos de ejemplo
          en memoria para que puedas probar la interfaz. Cuando configures tu proyecto en Supabase,
          pega el script de la pestaña <strong>Esquema SQL</strong> en tu panel de Supabase.
        </div>
      )}

      {/* Tabs */}
      <nav className="tabs-nav" aria-label="Secciones">
        <button
          className={`tab-btn ${activeTab === 'clans' ? 'active' : ''}`}
          onClick={() => setActiveTab('clans')}
        >
          🛡️ Clanes (Clans)
          <span className="tab-badge">{clans.length}</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'players' ? 'active' : ''}`}
          onClick={() => setActiveTab('players')}
        >
          🎮 Jugadores (Players)
          <span className="tab-badge">{players.length}</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'sql' ? 'active' : ''}`}
          onClick={() => setActiveTab('sql')}
        >
          📜 Esquema SQL & Migración
        </button>

        <button
          className={`tab-btn ${activeTab === 'docs' ? 'active' : ''}`}
          onClick={() => setActiveTab('docs')}
        >
          ⚡ Guía de Servicios
        </button>
      </nav>

      {/* TAB 1: CLANES */}
      {activeTab === 'clans' && (
        <section>
          <div className="filter-bar">
            <div className="search-input-wrapper">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Buscar clan por nombre o owner_id..."
                value={clanSearch}
                onChange={(e) => setClanSearch(e.target.value)}
                className="search-input"
              />
            </div>
            <button className="btn btn-primary" onClick={() => setShowCreateClanModal(true)}>
              ➕ Registrar Nuevo Clan
            </button>
          </div>

          {filteredClans.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🛡️</div>
              <h3>No se encontraron clanes</h3>
              <p>Intenta con otro término de búsqueda o crea un nuevo clan.</p>
            </div>
          ) : (
            <div className="cards-grid">
              {filteredClans.map((clan) => {
                const memberCount = players.filter((p) => p.clan_id === clan.id).length
                return (
                  <article key={clan.id} className="card">
                    <div className="card-header">
                      {clan.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={clan.photo_url}
                          alt={clan.name}
                          className="clan-avatar"
                          onError={(e) => {
                            ;(e.target as HTMLElement).style.display = 'none'
                          }}
                        />
                      ) : (
                        <div className="clan-avatar">{clan.name.charAt(0).toUpperCase()}</div>
                      )}
                      <div className="card-title-group">
                        <h2 className="card-title">{clan.name}</h2>
                        <span className="card-subtitle">ID: {clan.id.slice(0, 8)}...</span>
                      </div>
                    </div>

                    <div className="card-fields">
                      <div className="card-field-row">
                        <span className="card-field-label">Owner ID</span>
                        <span className="card-field-value">{clan.owner_id}</span>
                      </div>
                      <div className="card-field-row">
                        <span className="card-field-label">Miembros</span>
                        <span className="card-field-value" style={{ color: 'var(--hl-orange)' }}>
                          {memberCount} jugador{memberCount !== 1 ? 'es' : ''}
                        </span>
                      </div>
                      <div className="card-field-row">
                        <span className="card-field-label">Creado</span>
                        <span className="card-field-value">
                          {new Date(clan.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="card-field-row">
                        <span className="card-field-label">Actualizado</span>
                        <span className="card-field-value">
                          {new Date(clan.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="card-footer">
                      <span className="pill-badge">
                        <span>●</span> Activo
                      </span>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleViewClanMembers(clan.id)}
                      >
                        👥 Ver Miembros
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* TAB 2: JUGADORES */}
      {activeTab === 'players' && (
        <section>
          <div className="filter-bar">
            <div className="search-input-wrapper">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Buscar jugador por nombre o Steam ID..."
                value={playerSearch}
                onChange={(e) => setPlayerSearch(e.target.value)}
                className="search-input"
              />
            </div>

            <select
              value={selectedClanFilter}
              onChange={(e) => setSelectedClanFilter(e.target.value)}
              className="search-input"
              style={{ width: 'auto', minWidth: '200px' }}
            >
              <option value="all">Todos los clanes</option>
              <option value="unassigned">Sin Clan (Agentes Libres)</option>
              {clans.map((clan) => (
                <option key={clan.id} value={clan.id}>
                  Clan: {clan.name}
                </option>
              ))}
            </select>

            <button className="btn btn-primary" onClick={() => setShowCreatePlayerModal(true)}>
              ➕ Registrar Jugador
            </button>
          </div>

          {filteredPlayers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🎮</div>
              <h3>No se encontraron jugadores</h3>
              <p>Prueba ajustando el filtro de búsqueda o el clan seleccionado.</p>
            </div>
          ) : (
            <div className="cards-grid">
              {filteredPlayers.map((player) => (
                <article key={player.id} className="card">
                  <div className="card-header">
                    <div
                      className="clan-avatar"
                      style={{
                        background: player.clan ? 'rgba(255, 119, 0, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                        color: player.clan ? 'var(--hl-orange)' : 'var(--text-dim)',
                      }}
                    >
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="card-title-group">
                      <h2 className="card-title">{player.name}</h2>
                      <span className="card-subtitle">{player.steam_id}</span>
                    </div>
                  </div>

                  <div className="card-fields">
                    <div className="card-field-row">
                      <span className="card-field-label">Steam ID</span>
                      <span className="card-field-value">{player.steam_id}</span>
                    </div>
                    <div className="card-field-row">
                      <span className="card-field-label">Clan Asignado</span>
                      <span
                        className="card-field-value"
                        style={{ color: player.clan ? 'var(--hl-orange)' : 'var(--text-dim)' }}
                      >
                        {player.clan?.name || 'Ninguno (Libre)'}
                      </span>
                    </div>
                    <div className="card-field-row">
                      <span className="card-field-label">ID Clan</span>
                      <span className="card-field-value">
                        {player.clan_id ? `${player.clan_id.slice(0, 8)}...` : 'N/A'}
                      </span>
                    </div>
                    <div className="card-field-row">
                      <span className="card-field-label">Fecha Registro</span>
                      <span className="card-field-value">
                        {new Date(player.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="card-footer">
                    {player.clan ? (
                      <span className="pill-badge cyan">🛡️ {player.clan.name}</span>
                    ) : (
                      <span className="pill-badge gray">👤 Agente Libre</span>
                    )}
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      {player.id.slice(0, 8)}...
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB 3: ESQUEMA SQL & MIGRACIÓN */}
      {activeTab === 'sql' && (
        <section>
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.75rem',
              marginBottom: '1.5rem',
            }}
          >
            <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem', color: '#fff' }}>
              📜 DDL de Tablas para Supabase
            </h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Este script define las tablas <code style={{ color: 'var(--hl-orange)' }}>clans</code>{' '}
              y <code style={{ color: 'var(--hl-orange)' }}>players</code> con las columnas
              solicitadas, claves primarias UUID, llaves foráneas, índices de alto rendimiento,
              triggers para <code style={{ color: 'var(--hl-orange)' }}>updated_at</code> y
              políticas de seguridad Row Level Security (RLS).
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button className="btn btn-primary btn-sm" onClick={copySqlToClipboard}>
                {copiedSql ? '✓ ¡Copiado al Portapapeles!' : '📋 Copiar Script SQL'}
              </button>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                Disponible también en: <code style={{ color: '#fff' }}>supabase/schema.sql</code>
              </span>
            </div>
          </div>

          <div className="code-box">
            <div className="code-header">
              <span>supabase/schema.sql</span>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--hl-orange)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                }}
                onClick={copySqlToClipboard}
              >
                {copiedSql ? 'Copiado' : 'Copiar'}
              </button>
            </div>
            <pre className="code-content">{sqlSchemaCode}</pre>
          </div>
        </section>
      )}

      {/* TAB 4: GUÍA DE SERVICIOS */}
      {activeTab === 'docs' && (
        <section>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
            }}
          >
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.75rem',
              }}
            >
              <h2 style={{ fontSize: '1.3rem', color: '#fff', marginBottom: '0.5rem' }}>
                📁 Estructura de Servicios Creados
              </h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Los servicios han sido desacoplados y diseñados para funcionar indistintamente en
                Server Components, Client Components, Server Actions o Route Handlers:
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '1rem',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.85rem',
                }}
              >
                <div
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <strong style={{ color: 'var(--hl-orange)' }}>src/services/clans.service.ts</strong>
                  <ul style={{ paddingLeft: '1.2rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>
                    <li>getClans(params)</li>
                    <li>getClanById(id)</li>
                    <li>getClanWithMembers(id)</li>
                    <li>getClansByOwner(ownerId)</li>
                    <li>createClan(data)</li>
                    <li>updateClan(id, updates)</li>
                    <li>deleteClan(id)</li>
                    <li>countClans()</li>
                  </ul>
                </div>

                <div
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <strong style={{ color: 'var(--hl-cyan)' }}>src/services/players.service.ts</strong>
                  <ul style={{ paddingLeft: '1.2rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>
                    <li>getPlayers(params)</li>
                    <li>getPlayersWithClan(params)</li>
                    <li>getPlayerById(id)</li>
                    <li>getPlayerBySteamId(steamId)</li>
                    <li>getPlayersByClanId(clanId)</li>
                    <li>getUnassignedPlayers()</li>
                    <li>createPlayer(data)</li>
                    <li>assignToClan(playerId, clanId)</li>
                    <li>deletePlayer(id)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Ejemplos de código */}
            <div className="code-box">
              <div className="code-header">
                <span>Ejemplo 1: Uso en Server Component o Server Action (Next.js App Router)</span>
              </div>
              <pre className="code-content">{`import { createClient } from '@/lib/supabase/server'
import { createClansService, createPlayersService } from '@/services'

export default async function ClanMembersPage({ params }: { params: { id: string } }) {
  // 1. Instancia el cliente del servidor con cookies seguras
  const supabase = await createClient()

  // 2. Instancia los servicios pasando el cliente
  const clansService = createClansService(supabase)
  const playersService = createPlayersService(supabase)

  // 3. Ejecuta las consultas
  const clanRes = await clansService.getClanWithMembers(params.id)
  const playersRes = await playersService.getPlayers({ clanId: params.id })

  if (clanRes.error) {
    return <div>Error: {clanRes.error}</div>
  }

  const clan = clanRes.data
  return (
    <div>
      <h1>{clan?.name}</h1>
      <p>Total de miembros: {clan?.players.length}</p>
    </div>
  )
}`}</pre>
            </div>

            <div className="code-box">
              <div className="code-header">
                <span>Ejemplo 2: Uso en Client Component ('use client')</span>
              </div>
              <pre className="code-content">{`'use client'

import { useEffect, useState } from 'react'
import { createPlayersService, type Player } from '@/services'

export function PlayersList() {
  const [players, setPlayers] = useState<Player[]>([])

  useEffect(() => {
    async function load() {
      // En el cliente no es obligatorio pasar el cliente; usa el browserClient automáticamente
      const service = createPlayersService()
      const { data, error } = await service.getPlayers({ limit: 20 })
      if (data) setPlayers(data)
    }
    load()
  }, [])

  return (
    <ul>
      {players.map((p) => (
        <li key={p.id}>{p.name} - {p.steam_id}</li>
      ))}
    </ul>
  )
}`}</pre>
            </div>

            <div className="code-box">
              <div className="code-header">
                <span>Ejemplo 3: Endpoints REST creados (Route Handlers)</span>
              </div>
              <pre className="code-content">{`// GET /api/clans?search=Lambda&limit=10
// GET /api/clans/[id]?withMembers=true
// POST /api/clans -> Body: { "name": "Combine Overlords", "owner_id": "usr_99" }

// GET /api/players?steamId=STEAM_0:1:12345678
// GET /api/players?clanId=UUID&withClan=true
// POST /api/players -> Body: { "name": "Gordon", "steam_id": "STEAM_0:1:...", "clan_id": "..." }`}</pre>
            </div>
          </div>
        </section>
      )}

      {/* MODAL: Miembros del Clan */}
      {selectedClanDetails && (
        <div className="modal-overlay" onClick={() => setSelectedClanDetails(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.4rem', color: '#fff' }}>
                🛡️ Miembros de {selectedClanDetails.name}
              </h3>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setSelectedClanDetails(null)}
              >
                ✕ Cerrar
              </button>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              Owner ID: <code style={{ color: 'var(--hl-orange)' }}>{selectedClanDetails.owner_id}</code>
            </p>

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
                      background: 'rgba(0,0,0,0.35)',
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
                    <span className="pill-badge">Miembro</span>
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
              <h3 style={{ fontSize: '1.4rem', color: '#fff' }}>🛡️ Registrar Nuevo Clan</h3>
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
                  placeholder="Ej: Black Mesa Research Squad"
                  value={newClanName}
                  onChange={(e) => setNewClanName(e.target.value)}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Owner ID (ID del creador) *</label>
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
                <button type="submit" className="btn btn-primary" disabled={isPending}>
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
              <h3 style={{ fontSize: '1.4rem', color: '#fff' }}>🎮 Registrar Nuevo Jugador</h3>
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
                <button type="submit" className="btn btn-primary" disabled={isPending}>
                  {isPending ? 'Guardando...' : 'Registrar Jugador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
