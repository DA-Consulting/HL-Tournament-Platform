# 🎮 Half-Life Tournament Platform

Plataforma integral para gestión de torneos competitivos de Half-Life (1v1, 2v2/5v5 por equipos y ligas Round-Robin), construida con **Next.js 16 (App Router)** y **Supabase** (PostgreSQL, Auth, RLS).

---

## 🏗️ Arquitectura y Tecnologías

- **Framework Web:** [Next.js 16 (App Router)](https://nextjs.org/) con React 19, Server Components y Server Actions.
- **Base de Datos & Auth:** [Supabase](https://supabase.com/) con PostgreSQL, Row Level Security (RLS) y triggers automáticos.
- **Diseño & Estilos:** Vanilla CSS modular con paleta Half-Life (`#fb7e14`, `#000000`, `#151515`, `#292929`), microanimaciones y diseño responsivo adaptativo.
- **Notificaciones:** Sonner toast notifications.
- **Integraciones:** Steam Web API para resolución de perfiles y Steam IDs.

---

## 📋 Modelo de Datos

El esquema DDL completo y optimizado se encuentra en [`supabase/schema.sql`](./supabase/schema.sql).

### 1. `profiles`
Sincronizada automáticamente con `auth.users` mediante triggers de Supabase.
- `id` (uuid, PK, ref `auth.users`)
- `email` (text)
- `display_name` (text)
- `avatar_url` (text)
- `role` (text: `'player' | 'admin'`)
- `created_at`, `updated_at` (timestamptz)

### 2. `clans`
Gestión de clanes y equipos competitivos.
- `id` (uuid, PK, `gen_random_uuid()`)
- `name` (text, único)
- `owner_id` (text, ID del creador)
- `photo_url` (text, logo del clan)
- `created_at`, `updated_at` (timestamptz)

### 3. `players`
Perfil competitivo de jugadores en la plataforma.
- `id` (uuid, PK)
- `name` (text)
- `steam_id` (text, único)
- `clan_id` (uuid, FK `clans.id`, nullable para agentes libres)
- `created_at`, `updated_at` (timestamptz)

### 4. `tournaments`
Torneos activos, programados o finalizados.
- `id` (uuid, PK)
- `title` (text)
- `description` (text)
- `player_id` (uuid, FK `players.id`, Organizador)
- `status` (`'registration_open' | 'upcoming' | 'ongoing' | 'completed' | 'cancelled'`)
- `tournament_type` (`'individual' | 'team' | 'league'`)
- `start_date`, `end_date` (timestamptz)
- `prize_pool_amount` (numeric), `prize_pool_currency` (text: PEN, USD)
- `winner_player_id` (uuid, FK `players.id`, nullable)
- `banner_url`, `game_mode`, `max_participants`
- `created_at`, `updated_at` (timestamptz)

### 5. `tournament_players`
Inscripciones y rendimiento en cada torneo.
- `id` (uuid, PK)
- `tournament_id` (uuid, FK `tournaments.id` on delete cascade)
- `player_id` (uuid, FK `players.id` on delete cascade)
- `status` (`'registered' | 'confirmed' | 'active' | 'eliminated'`)
- `score`, `matches_played`, `matches_won`, `matches_lost`
- Restricción única: `(tournament_id, player_id)`

---

## 🚀 Puesta en Marcha

### 1. Prerrequisitos
- [Node.js](https://nodejs.org/) v20 o superior.
- Cuenta o proyecto activo en [Supabase](https://supabase.com).

### 2. Configurar Base de Datos en Supabase
1. Ingresa a tu panel en [Supabase Dashboard](https://supabase.com/dashboard).
2. Ve a **SQL Editor**.
3. Pega y ejecuta el contenido de [`supabase/schema.sql`](./supabase/schema.sql).
   - Genera tablas, índices compuestos y triggers de auditoría.
   - Aplica políticas de seguridad **Row Level Security (RLS)**.
   - Siembra datos semilla para pruebas locales.

### 3. Configurar Variables de Entorno
Copia el archivo base `.env.example`:

```bash
cp .env.example .env.local
```

Configura tus claves obtenidas en *Project Settings -> API*:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_tu-clave
SUPABASE_SECRET_KEY=sb_secret_tu-clave-secreta # Solo backend

# Opcional (Steam Vanity URL resolver)
STEAM_API_KEY=tu-steam-web-api-key
```

### 4. Instalar Dependencias y Ejecutar
```bash
# Instalar paquetes
npm install

# Iniciar servidor de desarrollo
npm run dev

# Validar linting
npm run lint

# Construir para producción
npm run build
```

El servidor iniciará en [http://localhost:3000](http://localhost:3000).

---

## 📂 Estructura del Proyecto

```text
├── src/
│   ├── actions/          # Next.js Server Actions (auth, clans, players, tournaments)
│   ├── app/              # App Router (páginas, layouts, rutas dinámicas y Route Handlers)
│   │   ├── api/          # Endpoints REST (/auth, /clans, /players, /tournaments, /steam)
│   │   ├── auth/         # Página de login y registro
│   │   ├── profile/      # Perfil de usuario y sincronización de Steam
│   │   ├── tournaments/  # Listado, filtros y creación de torneos
│   │   ├── tournament/   # Vista de detalle de torneo e inscripciones
│   │   └── page.tsx      # Dashboard principal con carrusel y estadísticas
│   ├── components/       # Componentes reutilizables (Navbar, modales, etc.)
│   ├── lib/
│   │   ├── supabase/     # Clientes browser, server, admin y middleware
│   │   └── action-response.ts # Normalización tipada de respuestas de Server Actions
│   ├── services/         # Capa de lógica desacoplada (Auth, Clans, Players, Tournaments)
│   └── types/            # Tipos de base de datos y modelos TypeScript
├── supabase/
│   └── schema.sql        # Esquema DDL de PostgreSQL con RLS y datos de prueba
├── .env.example          # Plantilla de variables de entorno
└── .gitignore            # Reglas de exclusión para Git y entornos de despliegue
```

---

## 🌐 Endpoints REST Principales

| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/api/auth/register` | Registro de usuario con email, contraseña y nombre |
| `POST` | `/api/auth/login` | Inicio de sesión seguro con cookies HTTP-only |
| `POST` | `/api/auth/logout` | Cierre de sesión y revocación de sesión |
| `GET` | `/api/auth/me` | Consulta del perfil de la sesión actual |
| `GET`, `POST` | `/api/tournaments` | Listado con filtros y creación de torneos |
| `GET`, `PATCH`, `DELETE` | `/api/tournaments/[id]` | Consulta, actualización y cancelación de torneo |
| `GET`, `POST` | `/api/clans` | Listado paginado y creación de clanes |
| `GET`, `PATCH`, `DELETE` | `/api/clans/[id]` | Detalle con miembros, edición y baja de clan |
| `GET`, `POST` | `/api/players` | Directorio de jugadores y vinculación |
| `GET`, `PATCH`, `DELETE` | `/api/players/[id]` | Detalle con clan, actualización y desvinculación |
| `GET` | `/api/steam/resolve` | Resolución de vanity URLs / Steam ID 64 |

---

## 🔐 Preparación para Repositorio Privado de Organización en GitHub

Para subir este proyecto a un repositorio privado en la organización de GitHub:

1. **Crear el repositorio en la Organización:**
   - Crear un repositorio vacío (sin README ni .gitignore iniciales para evitar conflictos) en GitHub bajo la organización deseada, marcado como **Private**.

2. **Verificar que no existan credenciales:**
   - Confirmar que `.env.local` esté ignorado (comprobado en `.gitignore`).
   - Los archivos `.env*` sensibles nunca deben ser añadidos al historial de git.

3. **Vincular el origen remoto y subir:**

```bash
# Cambiar el nombre de rama principal a 'main' si tu org lo requiere:
git branch -M main

# Agregar el control remoto de tu organización:
# Vía HTTPS:
git remote add origin https://github.com/TU-ORGANIZACION/HLTournamentPlatform.git

# O vía SSH:
# git remote add origin git@github.com:TU-ORGANIZACION/HLTournamentPlatform.git

# Subir la rama principal con upstream:
git push -u origin main
```

> [!NOTE]
> Si la organización requiere autenticación por token en HTTPS, utiliza un **Personal Access Token (classic o fine-grained)** con permisos `repo` o una clave SSH configurada en tu cuenta de GitHub.
