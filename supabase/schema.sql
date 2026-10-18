-- ==============================================================================
-- Half-Life Peru Tournaments: Schema DDL para Supabase
-- Tablas: profiles (Auth), clans, players, tournaments
-- ==============================================================================

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
-- 1. TABLA: profiles (Sincronizada con auth.users)
-- ------------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  avatar_url text,
  role text not null default 'player', -- 'player', 'admin'
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists idx_profiles_email on public.profiles(email);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- Trigger automático al registrar usuario en Supabase Auth:
-- Crea su fila en public.profiles y automáticamente su registro en public.players (a menos que sea admin)
create or replace function public.handle_new_user()
returns trigger as $$
declare
  user_role text;
  user_name text;
begin
  user_role := coalesce(new.raw_user_meta_data->>'role', 'player');
  user_name := coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));

  -- 1. Crear perfil de usuario para autenticación
  insert into public.profiles (id, email, display_name, avatar_url, role)
  values (
    new.id,
    new.email,
    user_name,
    new.raw_user_meta_data->>'avatar_url',
    user_role
  )
  on conflict (id) do update set
    email = excluded.email,
    display_name = coalesce(excluded.display_name, public.profiles.display_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url);

  -- 2. Si no es administrador, crear automáticamente su registro en public.players
  if user_role <> 'admin' then
    insert into public.players (user_id, name, steam_id, avatar_url)
    values (
      new.id,
      user_name,
      null, -- Se vinculará en su perfil con su cuenta de Steam
      new.raw_user_meta_data->>'avatar_url'
    )
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 2. TABLA: clans
-- ------------------------------------------------------------------------------
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
create index if not exists idx_clans_created_at on public.clans(created_at desc);

drop trigger if exists set_clans_updated_at on public.clans;
create trigger set_clans_updated_at
  before update on public.clans
  for each row execute function public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 3. TABLA: players
-- ------------------------------------------------------------------------------
create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique,
  name text not null,
  steam_id text unique, -- Nullable hasta que vincule su cuenta de Steam para torneos
  avatar_url text, -- Foto traída directamente desde Steam CDN
  clan_id uuid references public.clans(id) on delete set null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists idx_players_user_id on public.players(user_id);
create index if not exists idx_players_name on public.players(name);
create index if not exists idx_players_steam_id on public.players(steam_id);
create index if not exists idx_players_clan_id on public.players(clan_id);
create index if not exists idx_players_created_at on public.players(created_at desc);

drop trigger if exists set_players_updated_at on public.players;
create trigger set_players_updated_at
  before update on public.players
  for each row execute function public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 4. TABLA: tournaments
-- ------------------------------------------------------------------------------
create table if not exists public.tournaments (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  player_id uuid not null references public.players(id) on delete restrict, -- Organizador
  status text not null default 'upcoming', -- 'registration_open', 'upcoming', 'ongoing', 'completed', 'cancelled'
  start_date timestamp with time zone not null,
  end_date timestamp with time zone,
  prize_pool_currency text default 'PEN', -- 'PEN', 'USD'
  prize_pool_amount numeric(12, 2) default 0,
  winner_player_id uuid references public.players(id) on delete set null,
  tournament_type text not null default 'individual', -- 'individual' (1v1), 'team' (2v2, 5v5), 'league' (Liga / Round Robin)
  -- Campos extendidos recomendados para visualización y gestión completa:
  banner_url text, -- Imagen de portada para el carrusel hero
  game_mode text default 'Half-Life: Deathmatch (Crossfire)',
  max_participants integer default 16,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists idx_tournaments_status on public.tournaments(status);
create index if not exists idx_tournaments_start_date on public.tournaments(start_date desc);
create index if not exists idx_tournaments_player_id on public.tournaments(player_id);
create index if not exists idx_tournaments_type on public.tournaments(tournament_type);

drop trigger if exists set_tournaments_updated_at on public.tournaments;
create trigger set_tournaments_updated_at
  before update on public.tournaments
  for each row execute function public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 5. TABLA: tournament_players (Inscripciones de jugadores y estadísticas)
-- ------------------------------------------------------------------------------
create table if not exists public.tournament_players (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  score integer not null default 0,
  matches_played integer not null default 0,
  matches_won integer not null default 0,
  matches_lost integer not null default 0,
  status text not null default 'registered', -- 'registered', 'confirmed', 'active', 'eliminated'
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  unique (tournament_id, player_id)
);

create index if not exists idx_tournament_players_tournament_id on public.tournament_players(tournament_id);
create index if not exists idx_tournament_players_player_id on public.tournament_players(player_id);
create index if not exists idx_tournament_players_score on public.tournament_players(tournament_id, score desc);

drop trigger if exists set_tournament_players_updated_at on public.tournament_players;
create trigger set_tournament_players_updated_at
  before update on public.tournament_players
  for each row execute function public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 6. TABLA: tournament_matches (Partidas y resultados de torneos)
-- ------------------------------------------------------------------------------
create table if not exists public.tournament_matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  player1_id uuid not null references public.players(id) on delete cascade,
  player2_id uuid not null references public.players(id) on delete cascade,
  player1_score integer not null default 0,
  player2_score integer not null default 0,
  winner_player_id uuid references public.players(id) on delete set null,
  status text not null default 'completed', -- 'scheduled', 'ongoing', 'completed'
  map_name text not null default 'crossfire',
  round_name text default 'Fase Clasificatoria',
  played_at timestamp with time zone default now(),
  created_at timestamp with time zone not null default now()
);

create index if not exists idx_tournament_matches_tournament_id on public.tournament_matches(tournament_id);
create index if not exists idx_tournament_matches_played_at on public.tournament_matches(tournament_id, played_at desc);

-- ------------------------------------------------------------------------------
-- 7. POLÍTICAS ROW LEVEL SECURITY (RLS)
-- ------------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.clans enable row level security;
alter table public.players enable row level security;
alter table public.tournaments enable row level security;
alter table public.tournament_players enable row level security;
alter table public.tournament_matches enable row level security;

-- Profiles:
create policy "Permitir lectura publica de perfiles"
  on public.profiles for select to anon, authenticated using (true);
create policy "Permitir a cada usuario actualizar su propio perfil"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Clans:
create policy "Permitir lectura publica de clanes"
  on public.clans for select to anon, authenticated using (true);
create policy "Permitir insercion de clanes a usuarios autenticados"
  on public.clans for insert to authenticated with check (true);
create policy "Permitir actualizacion de clanes por owner"
  on public.clans for update to authenticated
  using (owner_id = (select auth.uid())::text) with check (owner_id = (select auth.uid())::text);
create policy "Permitir eliminacion de clanes por owner"
  on public.clans for delete to authenticated
  using (owner_id = (select auth.uid())::text);

-- Players:
create policy "Permitir lectura publica de jugadores"
  on public.players for select to anon, authenticated using (true);
create policy "Permitir a cada usuario insertar su propio registro de jugador"
  on public.players for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "Permitir a cada usuario actualizar su propio registro de jugador"
  on public.players for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "Permitir eliminacion de jugador propio"
  on public.players for delete to authenticated
  using (user_id = (select auth.uid()));

-- Tournaments:
create policy "Permitir lectura publica de torneos"
  on public.tournaments for select to anon, authenticated using (true);
create policy "Permitir insercion de torneos a usuarios autenticados"
  on public.tournaments for insert to authenticated with check (true);
create policy "Permitir actualizacion de torneos a usuarios autenticados"
  on public.tournaments for update to authenticated using (true) with check (true);
create policy "Permitir eliminacion de torneos a usuarios autenticados"
  on public.tournaments for delete to authenticated using (true);

-- Tournament Players:
create policy "Permitir lectura publica de tournament_players"
  on public.tournament_players for select to anon, authenticated using (true);
create policy "Permitir inscripcion de jugadores a usuarios autenticados"
  on public.tournament_players for insert to authenticated with check (true);
create policy "Permitir actualizacion de inscripciones a autenticados"
  on public.tournament_players for update to authenticated using (true) with check (true);
create policy "Permitir cancelacion de inscripcion"
  on public.tournament_players for delete to authenticated using (true);

-- Tournament Matches:
create policy "Permitir lectura publica de partidas de torneos"
  on public.tournament_matches for select to anon, authenticated using (true);
create policy "Permitir a autenticados gestionar partidas de torneos"
  on public.tournament_matches for all to authenticated using (true) with check (true);

-- ------------------------------------------------------------------------------
-- 8. DATOS DE PRUEBA (MOCK DATA)
-- ------------------------------------------------------------------------------
insert into public.clans (id, name, owner_id, photo_url)
values
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Black Mesa Squad Perú', 'usr_admin_001', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400'),
  ('b1ffcd88-8b1a-4ef8-bb6d-6bb9bd380a22', 'Lambda Core Rebels Lima', 'usr_admin_002', 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400'),
  ('c2eedd77-7a2b-4ef8-bb6d-6bb9bd380a33', 'HEV Elite Division', 'usr_admin_003', null)
on conflict (id) do nothing;

insert into public.players (id, name, steam_id, clan_id)
values
  ('d3eeaa66-6a3c-4ef8-bb6d-6bb9bd380a44', 'Gordon Freeman [PE]', 'STEAM_0:1:12345678', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  ('e4ddbb55-5b4d-4ef8-bb6d-6bb9bd380a55', 'Barney Calhoun', 'STEAM_0:0:87654321', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  ('f5ccaa44-4c5e-4ef8-bb6d-6bb9bd380a66', 'Adrian Shephard', 'STEAM_0:1:11223344', 'b1ffcd88-8b1a-4ef8-bb6d-6bb9bd380a22'),
  ('06bba933-3d6f-4ef8-bb6d-6bb9bd380a77', 'Eli Vance', 'STEAM_0:0:99887766', 'c2eedd77-7a2b-4ef8-bb6d-6bb9bd380a33'),
  ('17aa9822-2e7a-4ef8-bb6d-6bb9bd380a88', 'G-Man Mistery', 'STEAM_0:1:00000001', null)
on conflict (steam_id) do nothing;

insert into public.tournaments (
  id, title, description, player_id, status, start_date, end_date,
  prize_pool_currency, prize_pool_amount, winner_player_id, tournament_type,
  banner_url, game_mode, max_participants
)
values
  (
    '77aa1122-1111-4444-bbbb-000000000001',
    'Copa Nacional Crossfire Perú 2026',
    'El torneo más esperado del año. Enfréntate en el legendario bunker de Crossfire con los mejores clanes y jugadores del Perú.',
    'd3eeaa66-6a3c-4ef8-bb6d-6bb9bd380a44',
    'ongoing',
    now() - interval '2 days',
    now() + interval '5 days',
    'PEN',
    3500.00,
    null,
    'team',
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1400',
    'Half-Life: Deathmatch 5v5 (Crossfire & Stalkyard)',
    16
  ),
  (
    '77aa1122-2222-4444-bbbb-000000000002',
    'Torneo Relámpago Lambda 1v1',
    'Duelos a muerte individuales con Gauss, escopeta y revólver. Demuestra tu velocidad y habilidad en el salto TAU.',
    'e4ddbb55-5b4d-4ef8-bb6d-6bb9bd380a55',
    'registration_open',
    now() + interval '3 days',
    now() + interval '4 days',
    'USD',
    500.00,
    null,
    'individual',
    'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1400',
    'Half-Life 1v1 Hardcore Arena',
    32
  ),
  (
    '77aa1122-3333-4444-bbbb-000000000003',
    'Adrenaline Gamer AG Masters Lima',
    'Competencia de ritmo ultra rápido con física AG y armas clásicas. Para los más veloces de la escena competitiva.',
    'f5ccaa44-4c5e-4ef8-bb6d-6bb9bd380a66',
    'upcoming',
    now() + interval '12 days',
    now() + interval '14 days',
    'PEN',
    2000.00,
    null,
    'team',
    'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1400',
    'Adrenaline Gamer 2v2',
    24
  ),
  (
    '77aa1122-4444-4444-bbbb-000000000004',
    'Clash of Veterans: Boot Camp Classic',
    'Gran final de invierno concluida con una victoria épica en overtime.',
    'd3eeaa66-6a3c-4ef8-bb6d-6bb9bd380a44',
    'completed',
    now() - interval '20 days',
    now() - interval '18 days',
    'USD',
    1000.00,
    'd3eeaa66-6a3c-4ef8-bb6d-6bb9bd380a44',
    'individual',
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1400',
    'Boot Camp Deathmatch',
    16
  )
on conflict (id) do nothing;

-- Inscritos en Torneo: Copa Nacional Crossfire Perú 2026
insert into public.tournament_players (
  id, tournament_id, player_id, score, matches_played, matches_won, matches_lost, status
)
values
  ('88aa1111-0001-4444-bbbb-000000000001', '77aa1122-1111-4444-bbbb-000000000001', 'd3eeaa66-6a3c-4ef8-bb6d-6bb9bd380a44', 18, 6, 6, 0, 'confirmed'),
  ('88aa1111-0002-4444-bbbb-000000000002', '77aa1122-1111-4444-bbbb-000000000001', 'f5ccaa44-4c5e-4ef8-bb6d-6bb9bd380a66', 12, 6, 4, 2, 'confirmed'),
  ('88aa1111-0003-4444-bbbb-000000000003', '77aa1122-1111-4444-bbbb-000000000001', 'e4ddbb55-5b4d-4ef8-bb6d-6bb9bd380a55', 9, 5, 3, 2, 'confirmed'),
  ('88aa1111-0004-4444-bbbb-000000000004', '77aa1122-1111-4444-bbbb-000000000001', '06bba933-3d6f-4ef8-bb6d-6bb9bd380a77', 6, 5, 2, 3, 'confirmed'),
  ('88aa1111-0005-4444-bbbb-000000000005', '77aa1122-1111-4444-bbbb-000000000001', '17aa9822-2e7a-4ef8-bb6d-6bb9bd380a88', 3, 4, 1, 3, 'confirmed')
on conflict (tournament_id, player_id) do nothing;

-- Partidas jugadas en Torneo: Copa Nacional Crossfire Perú 2026
insert into public.tournament_matches (
  id, tournament_id, player1_id, player2_id, player1_score, player2_score, winner_player_id, status, map_name, round_name, played_at
)
values
  (
    '99aa1111-0001-4444-bbbb-000000000001',
    '77aa1122-1111-4444-bbbb-000000000001',
    'd3eeaa66-6a3c-4ef8-bb6d-6bb9bd380a44',
    'f5ccaa44-4c5e-4ef8-bb6d-6bb9bd380a66',
    50,
    38,
    'd3eeaa66-6a3c-4ef8-bb6d-6bb9bd380a44',
    'completed',
    'crossfire',
    'Fase de Grupos - Fecha 3',
    now() - interval '3 hours'
  ),
  (
    '99aa1111-0002-4444-bbbb-000000000002',
    '77aa1122-1111-4444-bbbb-000000000001',
    'e4ddbb55-5b4d-4ef8-bb6d-6bb9bd380a55',
    '06bba933-3d6f-4ef8-bb6d-6bb9bd380a77',
    45,
    42,
    'e4ddbb55-5b4d-4ef8-bb6d-6bb9bd380a55',
    'completed',
    'stalkyard',
    'Fase de Grupos - Fecha 2',
    now() - interval '18 hours'
  ),
  (
    '99aa1111-0003-4444-bbbb-000000000003',
    '77aa1122-1111-4444-bbbb-000000000001',
    'd3eeaa66-6a3c-4ef8-bb6d-6bb9bd380a44',
    'e4ddbb55-5b4d-4ef8-bb6d-6bb9bd380a55',
    50,
    29,
    'd3eeaa66-6a3c-4ef8-bb6d-6bb9bd380a44',
    'completed',
    'crossfire',
    'Fase de Grupos - Fecha 1',
    now() - interval '1 day'
  ),
  (
    '99aa1111-0004-4444-bbbb-000000000004',
    '77aa1122-1111-4444-bbbb-000000000001',
    'f5ccaa44-4c5e-4ef8-bb6d-6bb9bd380a66',
    '17aa9822-2e7a-4ef8-bb6d-6bb9bd380a88',
    50,
    31,
    'f5ccaa44-4c5e-4ef8-bb6d-6bb9bd380a66',
    'completed',
    'boot_camp',
    'Fase de Grupos - Fecha 1',
    now() - interval '1 day'
  )
on conflict (id) do nothing;

