-- ==============================================================================
-- Half-Life Tournament Platform: Schema DDL para Supabase
-- Tablas: clans, players
-- ==============================================================================

-- Habilitar extensión pgcrypto o uuid-ossp para generación de UUIDs (habilitado por defecto en Supabase)
create extension if not exists "uuid-ossp";

-- Función de ayuda para actualizar automáticamente el campo updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ------------------------------------------------------------------------------
-- 1. TABLA: clans
-- ------------------------------------------------------------------------------
create table if not exists public.clans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id text not null,
  photo_url text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Índices recomendados para rendimiento
create index if not exists idx_clans_name on public.clans(name);
create index if not exists idx_clans_owner_id on public.clans(owner_id);
create index if not exists idx_clans_created_at on public.clans(created_at desc);

-- Trigger para updated_at en clans
drop trigger if exists set_clans_updated_at on public.clans;
create trigger set_clans_updated_at
  before update on public.clans
  for each row
  execute function public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 2. TABLA: players
-- ------------------------------------------------------------------------------
create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  steam_id text not null unique,
  clan_id uuid references public.clans(id) on delete set null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Índices recomendados para rendimiento
create index if not exists idx_players_name on public.players(name);
create index if not exists idx_players_steam_id on public.players(steam_id);
create index if not exists idx_players_clan_id on public.players(clan_id);
create index if not exists idx_players_created_at on public.players(created_at desc);

-- Trigger para updated_at en players
drop trigger if exists set_players_updated_at on public.players;
create trigger set_players_updated_at
  before update on public.players
  for each row
  execute function public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 3. POLÍTICAS DE ROW LEVEL SECURITY (RLS)
-- Siguiendo las directrices de seguridad de Supabase
-- ------------------------------------------------------------------------------

-- Habilitar RLS en ambas tablas
alter table public.clans enable row level security;
alter table public.players enable row level security;

-- Políticas de LECTURA (Pública para consultas de torneos)
create policy "Permitir lectura publica de clanes"
  on public.clans
  for select
  to anon, authenticated
  using (true);

create policy "Permitir lectura publica de jugadores"
  on public.players
  for select
  to anon, authenticated
  using (true);

-- Políticas de ESCRITURA para usuarios autenticados
create policy "Permitir insercion de clanes a usuarios autenticados"
  on public.clans
  for insert
  to authenticated
  with check (true);

create policy "Permitir actualizacion de clanes por owner"
  on public.clans
  for update
  to authenticated
  using (owner_id = (select auth.uid())::text)
  with check (owner_id = (select auth.uid())::text);

create policy "Permitir eliminacion de clanes por owner"
  on public.clans
  for delete
  to authenticated
  using (owner_id = (select auth.uid())::text);

create policy "Permitir insercion de jugadores a usuarios autenticados"
  on public.players
  for insert
  to authenticated
  with check (true);

create policy "Permitir actualizacion de jugadores a usuarios autenticados"
  on public.players
  for update
  to authenticated
  using (true)
  with check (true);

create policy "Permitir eliminacion de jugadores a usuarios autenticados"
  on public.players
  for delete
  to authenticated
  using (true);

-- ------------------------------------------------------------------------------
-- 4. DATOS INICIALES DE PRUEBA (MOCK DATA)
-- ------------------------------------------------------------------------------
insert into public.clans (id, name, owner_id, photo_url)
values
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Black Mesa Squad', 'usr_admin_001', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400'),
  ('b1ffcd88-8b1a-4ef8-bb6d-6bb9bd380a22', 'Lambda Core Rebels', 'usr_admin_002', 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400'),
  ('c2eedd77-7a2b-4ef8-bb6d-6bb9bd380a33', 'HEV Elite Division', 'usr_admin_003', null)
on conflict (id) do nothing;

insert into public.players (id, name, steam_id, clan_id)
values
  ('d3eeaa66-6a3c-4ef8-bb6d-6bb9bd380a44', 'Gordon F.', 'STEAM_0:1:12345678', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  ('e4ddbb55-5b4d-4ef8-bb6d-6bb9bd380a55', 'Barney C.', 'STEAM_0:0:87654321', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  ('f5ccaa44-4c5e-4ef8-bb6d-6bb9bd380a66', 'Adrian S.', 'STEAM_0:1:11223344', 'b1ffcd88-8b1a-4ef8-bb6d-6bb9bd380a22'),
  ('06bba933-3d6f-4ef8-bb6d-6bb9bd380a77', 'Eli V.', 'STEAM_0:0:99887766', 'c2eedd77-7a2b-4ef8-bb6d-6bb9bd380a33'),
  ('17aa9822-2e7a-4ef8-bb6d-6bb9bd380a88', 'G-Man', 'STEAM_0:1:00000001', null)
on conflict (steam_id) do nothing;
