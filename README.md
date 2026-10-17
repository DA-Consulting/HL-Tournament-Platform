# 🎮 Half-Life Tournament Platform

Plataforma de torneos construida en **Next.js 16 (App Router)** con conexión directa a **Supabase**, tipos TypeScript estrictos y capa de servicios desacoplada para gestión de **Clanes (Clans)** y **Jugadores (Players)**.

---

## 📋 Modelo de Datos

### 1. Tabla: `clans`
| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `id` | `uuid` | Sí | Identificador único del clan (PK, `gen_random_uuid()`) |
| `name` | `text` | Sí | Nombre del clan |
| `owner_id` | `text` | Sí | ID del creador / propietario |
| `photo_url` | `text` | No (Opcional) | Identificador o URL de la imagen a mostrar en el perfil |
| `created_at` | `timestamptz` | Sí | Auditoría de creación del registro (`now()`) |
| `updated_at` | `timestamptz` | Sí | Auditoría de actualización (actualizado por trigger) |

### 2. Tabla: `players`
| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `id` | `uuid` | Sí | Identificador único del jugador (PK, `gen_random_uuid()`) |
| `name` | `text` | Sí | Nombre del jugador |
| `steam_id` | `text` | Sí | Identificador único de Steam (`unique`) |
| `clan_id` | `uuid` | No (Opcional) | Identificador del clan asociado (`FK -> clans.id`) |
| `created_at` | `timestamptz` | Sí | Auditoría de creación del registro (`now()`) |
| `updated_at` | `timestamptz` | Sí | Auditoría de actualización (actualizado por trigger) |

---

## 🚀 Puesta en Marcha Rápida

### 1. Configurar Base de Datos en Supabase
1. Abre tu panel de [Supabase Dashboard](https://supabase.com/dashboard).
2. Entra a tu proyecto y navega a **SQL Editor**.
3. Copia y ejecuta el contenido del archivo [`supabase/schema.sql`](./supabase/schema.sql).
   - Crea las tablas `clans` y `players`.
   - Crea índices optimizados (`idx_clans_owner_id`, `idx_players_steam_id`, `idx_players_clan_id`).
   - Activa triggers automáticos para `updated_at`.
   - Configura las políticas de seguridad **Row Level Security (RLS)**.
   - Inserta datos iniciales de prueba.

### 2. Configurar Variables de Entorno
Copia el archivo de ejemplo o edita `.env.local`:

```bash
cp .env.example .env.local
```

Configura tus credenciales (disponibles en *Project Settings -> API* o panel *Connect*):
```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_tu-clave-publica
SUPABASE_SECRET_KEY=sb_secret_tu-clave-secreta # Opcional, solo backend
```

### 3. Iniciar el Servidor de Desarrollo
```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver el dashboard interactivo de torneos.

---

## 🛠️ Arquitectura de Clientes Supabase

- **Browser Client (`src/lib/supabase/client.ts`)**: Para componentes del cliente (`'use client'`).
- **Server Client (`src/lib/supabase/server.ts`)**: Para Server Components, Server Actions y Route Handlers (`cookies()` seguras).
- **Admin Client (`src/lib/supabase/admin.ts`)**: Para operaciones elevadas de servidor usando `SUPABASE_SECRET_KEY`.
- **Proxy / Session (`src/proxy.ts` / `src/lib/supabase/middleware.ts`)**: Refresco automático de tokens de sesión.

---

## 📦 Capa de Servicios

Los servicios están disponibles en `@/services` y aceptan cualquier cliente de Supabase (servidor o cliente).

### Servicio de Clanes (`ClansService`)
Ubicación: [`src/services/clans.service.ts`](./src/services/clans.service.ts)

- `getClans(params?: ClanQueryParams)`: Listado con búsqueda por nombre, filtro por propietario y paginación.
- `getClanById(id: string)`: Obtiene un clan por su UUID.
- `getClanWithMembers(id: string)`: Obtiene el clan con todos sus jugadores asociados (`JOIN`).
- `getClansByOwner(ownerId: string)`: Clanes creados por un propietario.
- `createClan(data: ClanInsert)`: Registra un nuevo clan.
- `updateClan(id: string, updates: ClanUpdate)`: Actualiza campos de un clan.
- `deleteClan(id: string)`: Elimina un clan.
- `countClans()`: Conteo total.

### Servicio de Jugadores (`PlayersService`)
Ubicación: [`src/services/players.service.ts`](./src/services/players.service.ts)

- `getPlayers(params?: PlayerQueryParams)`: Listado con búsqueda, filtro por clan o sin clan, y paginación.
- `getPlayersWithClan(params?: PlayerQueryParams)`: Lista jugadores con la información completa de su clan.
- `getPlayerById(id: string)`: Jugador individual por ID.
- `getPlayerWithClanById(id: string)`: Jugador individual con datos de su clan.
- `getPlayerBySteamId(steamId: string)`: Búsqueda exacta por Steam ID.
- `getPlayersByClanId(clanId: string)`: Miembros de un clan.
- `getUnassignedPlayers()`: Jugadores libres sin clan (`clan_id is null`).
- `createPlayer(data: PlayerInsert)`: Registro de nuevo jugador.
- `updatePlayer(id: string, updates: PlayerUpdate)`: Actualización de datos.
- `assignToClan(playerId: string, clanId: string | null)`: Asignación o desvinculación de clan.
- `deletePlayer(id: string)`: Eliminación de jugador.

---

## 💻 Ejemplos de Uso

### En un Server Component (App Router)
```tsx
import { createClient } from '@/lib/supabase/server'
import { createClansService, createPlayersService } from '@/services'

export default async function TournamentRosterPage() {
  const supabase = await createClient()
  const clansService = createClansService(supabase)
  const playersService = createPlayersService(supabase)

  const { data: clans } = await clansService.getClans({ limit: 10 })
  const { data: players } = await playersService.getPlayersWithClan()

  return (
    <div>
      <h1>Clanes Registrados: {clans?.length}</h1>
      <ul>
        {players?.map((p) => (
          <li key={p.id}>
            {p.name} ({p.steam_id}) - Clan: {p.clan?.name ?? 'Libre'}
          </li>
        ))}
      </ul>
    </div>
  )
}
```

### En un Client Component (`'use client'`)
```tsx
'use client'

import { useEffect, useState } from 'react'
import { createPlayersService, type Player } from '@/services'

export function PlayersSearch() {
  const [players, setPlayers] = useState<Player[]>([])

  async function handleSearch(term: string) {
    const service = createPlayersService()
    const { data } = await service.getPlayers({ search: term })
    if (data) setPlayers(data)
  }

  return (
    <div>
      <input onChange={(e) => handleSearch(e.target.value)} placeholder="Buscar jugador..." />
      {players.map((p) => <div key={p.id}>{p.name}</div>)}
    </div>
  )
}
```

---

## 🌐 Endpoints REST Disponibles

| Método | Endpoint | Descripción | Parámetros Query |
|---|---|---|---|
| `GET` | `/api/clans` | Lista clanes | `?search=...&ownerId=...&limit=10&offset=0` |
| `POST` | `/api/clans` | Crea un clan | Body: `{ name, owner_id, photo_url? }` |
| `GET` | `/api/clans/[id]` | Detalle de clan | `?withMembers=true` |
| `PATCH` | `/api/clans/[id]` | Actualiza clan | Body: `{ name?, photo_url? }` |
| `DELETE` | `/api/clans/[id]` | Elimina clan | - |
| `GET` | `/api/players` | Lista jugadores | `?search=...&steamId=...&clanId=...&withClan=true` |
| `POST` | `/api/players` | Registra jugador | Body: `{ name, steam_id, clan_id? }` |
| `GET` | `/api/players/[id]` | Detalle de jugador | `?withClan=true` |
| `PATCH` | `/api/players/[id]` | Actualiza jugador | Body: `{ name?, clan_id? }` |
| `DELETE` | `/api/players/[id]` | Elimina jugador | - |
