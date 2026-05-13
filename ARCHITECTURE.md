# 📋 Arquitectura del Sistema - Academia FC Barcelona

## 📑 Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Arquitectura del Sistema](#arquitectura-del-sistema)
4. [Estructura de Carpetas](#estructura-de-carpetas)
5. [Base de Datos](#base-de-datos)
6. [API REST](#api-rest)
7. [Autenticación y Seguridad](#autenticación-y-seguridad)
8. [Configuración del Ambiente](#configuración-del-ambiente)
9. [Instrucciones de Instalación](#instrucciones-de-instalación)
10. [Instrucciones de Desarrollo](#instrucciones-de-desarrollo)

---

## 🎯 Visión General

**Academia FC Barcelona** es una plataforma profesional de gestión integral para una academia de fútbol juvenil. Diseñada para servir a **padres, entrenadores y directivos** del club, proporciona:

- 🎮 **Gestión de jugadores**: Perfiles, verificación, estadísticas
- 📅 **Gestión de partidos**: Programación, convocatorias, resultados
- 📢 **Comunicación**: Avisos, noticias, galería
- 📋 **Inscripciones**: Sistema de inscripción y conversión a jugadores verificados
- 🔐 **Credenciales QR**: Identificación segura de jugadores
- 📊 **Panel administrativo**: Configuración y reportes

### Colores Corporativos

- **Dorado**: `#D4AF37` - Marca principal, acentos
- **Azul Oscuro**: `#0F3460` - Secundario, énfasis
- **Negro**: `#1A1A2E` - Fondo, base

---

## 🛠️ Stack Tecnológico

### Backend

| Tecnología | Versión | Propósito |
|---|---|---|
| **Node.js** | 20+ | Runtime JavaScript |
| **Express.js** | 4.21+ | Framework web |
| **TypeScript** | 5.6+ | Tipado estático |
| **Supabase** | v2.45.4+ | Base de datos PostgreSQL + Auth |
| **JWT** | 9.0+ | Autenticación (tokens) |
| **bcryptjs** | 2.4+ | Hash de contraseñas |
| **Zod** | 3.23+ | Validación de esquemas |
| **Winston** | 3.15+ | Logging |
| **Jest** | 29+ | Testing |
| **QRCode** | 1.5+ | Generación de QR |

### Frontend

| Tecnología | Versión | Propósito |
|---|---|---|
| **React** | 18.3+ | UI Library |
| **TypeScript** | 5.6+ | Tipado estático |
| **Vite** | 5.4+ | Build tool |
| **React Router** | 6.28+ | Enrutamiento |
| **Tailwind CSS** | 3.4+ | Estilos |
| **TanStack Query** | 5.59+ | Gestión de estado (queries) |
| **React Hook Form** | 7.53+ | Manejo de formularios |
| **Zod** | 3.23+ | Validación de esquemas |
| **Framer Motion** | 11.11+ | Animaciones |
| **Lucide React** | 0.454+ | Iconografía |
| **Axios** | 1.7+ | HTTP Client |

### DevOps & Testing

- **Docker** (para producción)
- **PostgreSQL 15+** (Supabase)
- **Git** (control de versiones)
- **Vitest** (testing frontend)
- **Supertest** (testing API)

---

## 🏗️ Arquitectura del Sistema

### Diagrama General

```
┌─────────────────────────────────────────────────────────────────┐
│                        NAVEGADOR CLIENTE                        │
│                    (React + Vite + TypeScript)                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    HTTP/HTTPS (CORS)
                             │
        ┌────────────────────┴────────────────────┐
        │                                         │
┌───────▼──────────────────────────────┐  ┌─────▼────────────────┐
│    API REST EXPRESS (Node.js)        │  │  Static Files (CDN)  │
│  ├─ /api/v1/auth                     │  │                      │
│  ├─ /api/v1/users                    │  │  - Images            │
│  ├─ /api/v1/players                  │  │  - Documents         │
│  ├─ /api/v1/parents                  │  │  - Media             │
│  ├─ /api/v1/matches                  │  └──────────────────────┘
│  ├─ /api/v1/results                  │
│  ├─ /api/v1/notices                  │
│  ├─ /api/v1/gallery                  │
│  ├─ /api/v1/inscriptions             │
│  ├─ /api/v1/qr                       │
│  └─ /api/v1/settings                 │
│                                       │
│  Middleware Stack:                    │
│  ├─ CORS                              │
│  ├─ Rate Limiting                     │
│  ├─ JSON Parser                       │
│  ├─ Request Logging (Winston)         │
│  ├─ Authentication (JWT)              │
│  ├─ Role-Based Access Control         │
│  └─ Error Handling                    │
│                                       │
│  MVC + Modular Architecture:          │
│  ├─ Routes (express Router)           │
│  ├─ Controllers (lógica)              │
│  ├─ Services (negocio)                │
│  └─ Validators (Zod)                  │
└───────┬──────────────────────────────┘
        │
        │ Supabase Client
        │ (JWT Token + API Key)
        │
┌───────▼──────────────────────────────┐
│     SUPABASE (PostgreSQL 15+)         │
│                                       │
│  Tables:                              │
│  ├─ users (autenticación)             │
│  ├─ refresh_tokens (rotación)         │
│  ├─ parents (perfiles)                │
│  ├─ players (jugadores)               │
│  ├─ parent_players (relación)         │
│  ├─ matches (partidos)                │
│  ├─ match_convocatories (convocatorias)│
│  ├─ results (resultados)              │
│  ├─ player_stats (estadísticas)       │
│  ├─ notices (avisos)                  │
│  ├─ gallery_posts (galería)           │
│  ├─ gallery_media (multimedia)        │
│  ├─ inscriptions (inscripciones)      │
│  ├─ qr_validations (validaciones QR)  │
│  ├─ club_settings (configuración)     │
│  │                                    │
│  Views (consultas complejas):         │
│  ├─ v_player_career_stats             │
│  ├─ v_match_results                   │
│  ├─ v_upcoming_matches                │
│  ├─ v_dashboard_summary               │
│  └─ v_player_public_credential        │
│                                       │
│  RLS (Row Level Security): ✓ Habilitado│
│  Soft Deletes: ✓ Implementado         │
│  Auditoría (updated_at): ✓ Habilitado │
└───────────────────────────────────────┘
```

### Patrones de Diseño

#### MVC + Modular por Dominio

```
src/
├─ config/              # Configuración centralizada
│  ├─ env.ts           # Variables de ambiente (Zod validado)
│  ├─ database.ts      # Clientes Supabase
│  └─ constants.ts     # Constantes globales
│
├─ middlewares/         # Express middlewares
│  ├─ auth.middleware.ts              # Validación JWT
│  ├─ role.middleware.ts              # RBAC
│  ├─ validate.middleware.ts          # Validación Zod
│  ├─ error.middleware.ts             # Manejo de errores
│  └─ request-context.middleware.ts   # Request ID + logging
│
├─ shared/              # Código compartido
│  ├─ types/           # TypeScript interfaces (index.ts)
│  └─ utils/           # Utilidades (response, logger, route-params)
│
├─ modules/             # Módulos por dominio (MVC por módulo)
│  │
│  ├─ auth/
│  │  ├─ auth.routes.ts        # Router (express)
│  │  ├─ auth.controller.ts    # Controllers
│  │  ├─ auth.service.ts       # Lógica negocio
│  │  └─ auth.validation.ts    # Esquemas Zod
│  │
│  ├─ players/
│  │  ├─ players.routes.ts
│  │  ├─ players.controller.ts
│  │  ├─ players.service.ts
│  │  └─ players.validation.ts
│  │
│  ├─ parents/
│  ├─ users/
│  ├─ matches/
│  ├─ results/
│  ├─ notices/
│  ├─ gallery/
│  ├─ inscriptions/
│  ├─ qr-validation/
│  └─ settings/
│
├─ app.ts              # Express factory (createApp)
└─ server.ts           # HTTP server + Entry point
```

---

## 📁 Estructura de Carpetas

### Raíz del Proyecto

```
barcelona/
├─ backend/                  # Backend Node.js + TypeScript
│  ├─ src/
│  │  ├─ config/            # env.ts, database.ts, constants.ts
│  │  ├─ middlewares/       # auth, role, validate, error, request-context
│  │  ├─ shared/            # types/ (interfaces), utils/ (response, logger, route-params)
│  │  ├─ modules/           # 11 módulos MVC por dominio
│  │  ├─ types/             # (Reservado para tipos Express augmentation)
│  │  ├─ app.ts             # Express factory (createApp)
│  │  └─ server.ts          # HTTP server + entry point
│  │
│  ├─ tests/                 # Tests (Jest + Supertest)
│  │  └─ app.test.ts
│  ├─ dist/                  # Código compilado (generado)
│  ├─ coverage/              # Reporte de coverage (generado)
│  ├─ package.json
│  ├─ tsconfig.json
│  ├─ tsconfig.jest.json
│  ├─ jest.config.ts
│  ├─ .env.example
│  ├─ .env.development
│  ├─ .env.test
│  └─ .env.production
│
├─ frontend/                 # Frontend React + Vite
│  ├─ src/
│  │  ├─ components/         # Componentes reutilizables (ProtectedRoute, Spinner)
│  │  ├─ pages/             # Páginas públicas + dashboard/
│  │  ├─ layouts/           # PublicLayout, DashboardLayout
│  │  ├─ contexts/          # AuthContext
│  │  ├─ api/               # Servicios HTTP (Axios)
│  │  ├─ types/             # TypeScript interfaces
│  │  ├─ utils/             # Utilidades (constants.ts)
│  │  ├─ App.tsx            # Componente raíz + rutas
│  │  ├─ main.tsx           # Entry point
│  │  └─ index.css          # Estilos globales (Tailwind)
│  │
│  ├─ dist/                  # Build producción (generado)
│  ├─ package.json
│  ├─ tsconfig.json
│  ├─ tsconfig.node.json
│  ├─ vite.config.ts
│  ├─ tailwind.config.ts
│  ├─ postcss.config.cjs
│  ├─ index.html
│  ├─ .env.example
│  ├─ .env.development
│  ├─ .env.test
│  └─ .env.production
│
├─ database/                 # Scripts de BD
│  ├─ schema.sql            # Esquema completo (1081 líneas)
│  └─ seed.sql              # Datos de prueba
│
├─ ARCHITECTURE.md           # Este archivo
│
│  # ── Planificado ──
│  # ├─ .gitignore
│  # ├─ README.md
│  # ├─ docs/               # API.md, DATABASE.md, DEPLOYMENT.md
│  # ├─ docker/             # Dockerfile.backend, Dockerfile.frontend, docker-compose.yml
│  # └─ database/migrations/
```

---

## 🗄️ Base de Datos

### Especificaciones

- **Motor**: PostgreSQL 15+
- **Hosting**: Supabase (managed)
- **Primary Keys**: UUID v4
- **Timestamps**: `created_at`, `updated_at` (con triggers)
- **Soft Deletes**: Campo `deleted_at`
- **RLS**: Row Level Security habilitado
- **Sesión**: `2024-2025`

### Tablas Principales

#### `users` - Usuarios del sistema

```sql
id                        UUID PRIMARY KEY
email                     VARCHAR(255) UNIQUE NOT NULL
password_hash             VARCHAR(255) NOT NULL (bcrypt)
role                      ENUM (admin, coach, parent)
status                    ENUM (active, inactive, suspended, pending)
full_name                 VARCHAR(150) NOT NULL
avatar_url                TEXT
phone                     VARCHAR(30)
last_login_at             TIMESTAMPTZ
email_verified            BOOLEAN DEFAULT FALSE
email_verified_at         TIMESTAMPTZ
password_reset_token      VARCHAR(255)
password_reset_expires_at TIMESTAMPTZ
deleted_at                TIMESTAMPTZ (soft delete)
created_at                TIMESTAMPTZ DEFAULT NOW()
updated_at                TIMESTAMPTZ DEFAULT NOW()
```

#### `refresh_tokens` - Tokens de refresco (rotación)

```sql
id          UUID PRIMARY KEY
user_id     UUID FK → users(id) ON DELETE CASCADE
token_hash  VARCHAR(255) NOT NULL UNIQUE (SHA-256)
expires_at  TIMESTAMPTZ NOT NULL
revoked     BOOLEAN DEFAULT FALSE
revoked_at  TIMESTAMPTZ
ip_address  INET
user_agent  TEXT
created_at  TIMESTAMPTZ DEFAULT NOW()
```

#### `parents` - Perfil extendido de padres/tutores

```sql
id                      UUID PRIMARY KEY
user_id                 UUID FK → users(id) UNIQUE
first_name              VARCHAR(100) NOT NULL
last_name               VARCHAR(100) NOT NULL
phone_primary           VARCHAR(30) NOT NULL
phone_secondary         VARCHAR(30)
relationship            VARCHAR(50) (padre, madre, tutor, tutora, abuelo, abuela, tio, tia, otro)
occupation              VARCHAR(100)
emergency_contact_name  VARCHAR(150)
emergency_contact_phone VARCHAR(30)
notes                   TEXT
deleted_at              TIMESTAMPTZ
created_at              TIMESTAMPTZ DEFAULT NOW()
updated_at              TIMESTAMPTZ DEFAULT NOW()
```

#### `players` - Jugadores del club

```sql
id                  UUID PRIMARY KEY
first_name          VARCHAR(100) NOT NULL
last_name           VARCHAR(100) NOT NULL
birth_date          DATE NOT NULL
nationality         VARCHAR(100) DEFAULT 'Mexicana'
position            VARCHAR(80) NOT NULL
secondary_position  VARCHAR(80)
jersey_number       SMALLINT (1-99, unique per category)
dominant_foot       ENUM (right, left, both) DEFAULT 'right'
height_cm           SMALLINT (80-250)
weight_kg           SMALLINT (15-150)
category            VARCHAR(50) NOT NULL (Sub-11, Sub-13, Sub-15, Sub-17, Sub-20)
sport_description   TEXT
avatar_url          TEXT
status              ENUM (active, inactive, injured, suspended, pending_verification)
is_verified         BOOLEAN DEFAULT FALSE
verified_at         TIMESTAMPTZ
verified_by         UUID FK → users(id)
qr_token            VARCHAR(255) UNIQUE
qr_generated_at     TIMESTAMPTZ
season              VARCHAR(20) DEFAULT '2024-2025'
achievements        TEXT
notes               TEXT
deleted_at          TIMESTAMPTZ (soft delete)
created_at          TIMESTAMPTZ DEFAULT NOW()
updated_at          TIMESTAMPTZ DEFAULT NOW()
```

#### `parent_players` - Relación N:M padres ↔ jugadores

```sql
id                  UUID PRIMARY KEY
parent_id           UUID FK → parents(id) ON DELETE CASCADE
player_id           UUID FK → players(id) ON DELETE CASCADE
is_primary_contact  BOOLEAN DEFAULT FALSE
created_at          TIMESTAMPTZ DEFAULT NOW()
UNIQUE(parent_id, player_id)
```

#### `matches` - Partidos

```sql
id                UUID PRIMARY KEY
title             VARCHAR(200) NOT NULL
description       TEXT
opponent_name     VARCHAR(150) NOT NULL
opponent_logo_url TEXT
match_date        TIMESTAMPTZ NOT NULL
location          VARCHAR(200) NOT NULL
location_maps_url TEXT
match_type        ENUM (league, cup, friendly, tournament, internal)
category          VARCHAR(50) NOT NULL
status            ENUM (scheduled, in_progress, completed, cancelled, postponed)
is_home           BOOLEAN DEFAULT TRUE
banner_url        TEXT
season            VARCHAR(20) DEFAULT '2024-2025'
created_by        UUID FK → users(id)
deleted_at        TIMESTAMPTZ (soft delete)
created_at        TIMESTAMPTZ DEFAULT NOW()
updated_at        TIMESTAMPTZ DEFAULT NOW()
```

#### `match_convocatories` - Convocatorias por partido

```sql
id           UUID PRIMARY KEY
match_id     UUID FK → matches(id) ON DELETE CASCADE
player_id    UUID FK → players(id) ON DELETE CASCADE
status       ENUM (called, confirmed, declined, absent)
notes        TEXT
called_at    TIMESTAMPTZ DEFAULT NOW()
responded_at TIMESTAMPTZ
UNIQUE(match_id, player_id)
```

#### `results` - Resultados de partidos

```sql
id                 UUID PRIMARY KEY
match_id           UUID FK → matches(id) UNIQUE ON DELETE CASCADE
goals_scored       SMALLINT NOT NULL DEFAULT 0
goals_conceded     SMALLINT NOT NULL DEFAULT 0
outcome            VARCHAR(10) GENERATED (win/loss/draw según marcador)
match_report       TEXT
highlight_url      TEXT
featured_player_id UUID FK → players(id)
published          BOOLEAN DEFAULT FALSE
published_at       TIMESTAMPTZ
created_by         UUID FK → users(id)
created_at         TIMESTAMPTZ DEFAULT NOW()
updated_at         TIMESTAMPTZ DEFAULT NOW()
```

#### `player_stats` - Estadísticas individuales por partido

```sql
id             UUID PRIMARY KEY
result_id      UUID FK → results(id) ON DELETE CASCADE
player_id      UUID FK → players(id) ON DELETE CASCADE
goals          SMALLINT DEFAULT 0
assists        SMALLINT DEFAULT 0
yellow_cards   SMALLINT (0-2)
red_cards      SMALLINT (0-1)
minutes_played SMALLINT (0-120)
rating         DECIMAL(3,1) (1.0-10.0)
notes          TEXT
created_at     TIMESTAMPTZ DEFAULT NOW()
updated_at     TIMESTAMPTZ DEFAULT NOW()
UNIQUE(result_id, player_id)
```

#### `notices` - Avisos/comunicados

```sql
id              UUID PRIMARY KEY
title           VARCHAR(200) NOT NULL
content         TEXT NOT NULL
type            ENUM (general, urgent, event, training, match, administrative)
audience        ENUM (all, parents, players, coaches, specific_category)
target_category VARCHAR(50)
is_published    BOOLEAN DEFAULT FALSE
published_at    TIMESTAMPTZ
expires_at      TIMESTAMPTZ
is_pinned       BOOLEAN DEFAULT FALSE
cover_image_url TEXT
created_by      UUID FK → users(id)
deleted_at      TIMESTAMPTZ (soft delete)
created_at      TIMESTAMPTZ DEFAULT NOW()
updated_at      TIMESTAMPTZ DEFAULT NOW()
```

#### `gallery_posts` - Publicaciones de galería

```sql
id                UUID PRIMARY KEY
title             VARCHAR(200) NOT NULL
caption           TEXT
type              ENUM (match_day, result, featured_player, training, convocatory, general, achievement)
related_match_id  UUID FK → matches(id)
related_player_id UUID FK → players(id)
is_published      BOOLEAN DEFAULT FALSE
published_at      TIMESTAMPTZ
views_count       INTEGER DEFAULT 0
likes_count       INTEGER DEFAULT 0
is_featured       BOOLEAN DEFAULT FALSE
season            VARCHAR(20) DEFAULT '2024-2025'
created_by        UUID FK → users(id)
deleted_at        TIMESTAMPTZ (soft delete)
created_at        TIMESTAMPTZ DEFAULT NOW()
updated_at        TIMESTAMPTZ DEFAULT NOW()
```

#### `gallery_media` - Archivos multimedia

```sql
id               UUID PRIMARY KEY
post_id          UUID FK → gallery_posts(id) ON DELETE CASCADE
url              TEXT NOT NULL
type             ENUM (image, video) DEFAULT 'image'
thumbnail_url    TEXT
caption          TEXT
sort_order       SMALLINT DEFAULT 0
file_size_bytes  INTEGER
width_px         SMALLINT
height_px        SMALLINT
created_at       TIMESTAMPTZ DEFAULT NOW()
```

#### `inscriptions` - Solicitudes de inscripción

```sql
id                      UUID PRIMARY KEY
-- Datos del padre/tutor
parent_first_name       VARCHAR(100) NOT NULL
parent_last_name        VARCHAR(100) NOT NULL
parent_email            VARCHAR(255) NOT NULL
parent_phone            VARCHAR(30) NOT NULL
parent_relationship     VARCHAR(50) DEFAULT 'padre'
-- Datos del jugador
player_first_name       VARCHAR(100) NOT NULL
player_last_name        VARCHAR(100) NOT NULL
player_birth_date       DATE NOT NULL
player_nationality      VARCHAR(100) DEFAULT 'Mexicana'
player_position         VARCHAR(80) NOT NULL
player_dominant_foot    ENUM (right, left, both) DEFAULT 'right'
player_height_cm        SMALLINT
player_weight_kg        SMALLINT
player_category         VARCHAR(50) NOT NULL
player_previous_club    VARCHAR(150)
player_sport_description TEXT
player_avatar_url       TEXT
-- Gestión
status                  ENUM (pending, under_review, approved, rejected, waitlist)
reviewed_by             UUID FK → users(id)
reviewed_at             TIMESTAMPTZ
review_notes            TEXT
rejection_reason        TEXT
converted_player_id     UUID FK → players(id)
converted_at            TIMESTAMPTZ
ip_address              INET
deleted_at              TIMESTAMPTZ
created_at              TIMESTAMPTZ DEFAULT NOW()
updated_at              TIMESTAMPTZ DEFAULT NOW()
```

#### `club_settings` - Configuración global del club (singleton)

```sql
id                 UUID PRIMARY KEY
club_name          VARCHAR(150) DEFAULT 'Academia Barcelona'
club_logo_url      TEXT
club_description   TEXT
season             VARCHAR(20) DEFAULT '2024-2025'
primary_color      VARCHAR(7) DEFAULT '#D4AF37'
secondary_color    VARCHAR(7) DEFAULT '#1A1A2E'
accent_color       VARCHAR(7) DEFAULT '#0F3460'
contact_email      VARCHAR(255)
contact_phone      VARCHAR(30)
contact_address    TEXT
website_url        TEXT
instagram_url      TEXT
facebook_url       TEXT
twitter_url        TEXT
is_active          BOOLEAN DEFAULT TRUE
created_at         TIMESTAMPTZ DEFAULT NOW()
updated_at         TIMESTAMPTZ DEFAULT NOW()
```

#### `qr_validations` - Auditoría de escaneos QR

```sql
id           UUID PRIMARY KEY
player_id    UUID FK → players(id) ON DELETE CASCADE
qr_token     VARCHAR(255) NOT NULL
result       ENUM (valid, invalid, expired, not_found)
validated_at TIMESTAMPTZ DEFAULT NOW()
ip_address   INET
user_agent   TEXT
```

### Vistas Útiles

#### `v_player_career_stats`
- Estadísticas agregadas de cada jugador
- Usado en listado público de jugadores

#### `v_match_results`
- Resultados con datos del partido

#### `v_upcoming_matches`
- Próximos partidos ordenados

#### `v_dashboard_summary`
- Resumen para dashboard admin

#### `v_player_public_credential`
- Datos públicos para validación QR

### Relaciones Principales

```
users (1) ──── (N) refresh_tokens
users (1) ──── (1) parents (user_id UNIQUE)
users (1) ──── (N) players (verified_by)
users (1) ──── (N) matches (created_by)
users (1) ──── (N) results (created_by)
users (1) ──── (N) notices (created_by)
users (1) ──── (N) gallery_posts (created_by)
users (1) ──── (N) inscriptions (reviewed_by)

parents (1) ──── (N) parent_players
players (1) ──── (N) parent_players
players (1) ──── (N) match_convocatories
players (1) ──── (N) player_stats
players (1) ──── (N) qr_validations

matches (1) ──── (1) results (match_id UNIQUE)
matches (1) ──── (N) match_convocatories

results (1) ──── (N) player_stats
results (N) ──── (1) players (featured_player_id)

gallery_posts (1) ──── (N) gallery_media
inscriptions  (1) ──── (1) players (converted_player_id)
```

---

## 🔌 API REST

### Base URL

```
Development:  http://localhost:3001/api/v1
Production:   https://api.barcelonamty.com/api/v1
```

### Convenciones

- **Método GET**: Lectura
- **Método POST**: Creación
- **Método PUT**: Actualización completa
- **Método PATCH**: Actualización parcial
- **Método DELETE**: Eliminación (soft delete)

### Response Format

#### Success (2xx)

```json
{
  "success": true,
  "message": "Descripción de la acción",
  "data": { /* datos */ },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### Error (4xx, 5xx)

```json
{
  "success": false,
  "message": "Error general",
  "errors": [
    {
      "field": "email",
      "message": "Email ya existe en el sistema"
    }
  ]
}
```

### Módulos y Endpoints

#### 📝 Auth (`/auth`)

- `POST /auth/login` - Login con email/password
- `POST /auth/register` - Registro de padre
- `POST /auth/refresh` - Refrescar token (rotación)
- `POST /auth/logout` - Logout (revocar tokens)
- `GET /auth/me` - Obtener usuario autenticado

#### 👥 Users (`/users`)

- `GET /users/` - Listar usuarios (admin/coach)
- `GET /users/:id` - Obtener usuario (admin/coach)

#### ⚽ Players (`/players`)

- `GET /players/public` - Listar jugadores públicamente
- `GET /players/public/:id` - Ver perfil público de jugador
- `GET /players/` - Listar jugadores (admin/coach)
- `GET /players/:id` - Obtener jugador (admin/coach)
- `POST /players/` - Crear jugador (admin/coach)
- `PUT /players/:id` - Actualizar jugador (admin/coach)
- `PATCH /players/:id/verify` - Verificar jugador (admin)
- `PATCH /players/:id/generate-qr` - Generar QR (admin/coach)
- `DELETE /players/:id` - Eliminar jugador (admin)

#### 👨‍👩‍👧 Parents (`/parents`)

- `GET /parents/` - Listar padres (admin/coach)
- `GET /parents/my-players` - Mis jugadores (padre autenticado)
- `GET /parents/:id` - Obtener padre (admin/coach)

#### 🏟️ Matches (`/matches`)

- `GET /matches/public` - Listar partidos públicamente
- `GET /matches/public/upcoming` - Próximos partidos
- `GET /matches/public/:id` - Detalles partido
- `GET /matches/` - Listar partidos (admin/coach)
- `POST /matches/` - Crear partido (admin/coach)
- `PUT /matches/:id` - Actualizar partido (admin/coach)
- `POST /matches/:id/convocatories` - Crear convocatoria (admin/coach)

#### 📊 Results (`/results`)

- `GET /results/public` - Resultados públicos
- `GET /results/public/latest` - Último resultado
- `GET /results/` - Listar resultados (admin/coach)
- `POST /results/` - Crear resultado (admin/coach)
- `PUT /results/:id` - Actualizar resultado (admin/coach)
- `PATCH /results/:id/publish` - Publicar resultado (admin/coach)

#### 📢 Notices (`/notices`)

- `GET /notices/public` - Avisos públicos
- `GET /notices/public/:id` - Detalles aviso
- `GET /notices/` - Listar avisos (admin/coach)
- `POST /notices/` - Crear aviso (admin/coach)
- `PUT /notices/:id` - Actualizar aviso (admin/coach)
- `PATCH /notices/:id/publish` - Publicar aviso (admin/coach)
- `DELETE /notices/:id` - Eliminar aviso (admin/coach)

#### 🖼️ Gallery (`/gallery`)

- `GET /gallery/public` - Fotos/videos públicos
- `GET /gallery/public/:id` - Detalles galería
- `GET /gallery/` - Listar galerías (admin/coach)
- `POST /gallery/` - Crear galería (admin/coach)
- `PUT /gallery/:id` - Actualizar galería (admin/coach)
- `PATCH /gallery/:id/publish` - Publicar galería (admin/coach)
- `DELETE /gallery/:id` - Eliminar galería (admin/coach)

#### 📋 Inscriptions (`/inscriptions`)

- `POST /inscriptions/public` - Nueva inscripción (público)
- `GET /inscriptions/` - Listar inscripciones (admin/coach)
- `GET /inscriptions/:id` - Obtener inscripción
- `PATCH /inscriptions/:id/approve` - Aprobar (admin/coach)
- `PATCH /inscriptions/:id/reject` - Rechazar (admin/coach)
- `POST /inscriptions/:id/convert` - Convertir a jugador (admin/coach)

#### 🔐 QR (`/qr`)

- `GET /qr/validate/:token` - Validar QR (público, desde celular)
- `GET /qr/player/:id/image` - Imagen QR de jugador

#### ⚙️ Settings (`/settings`)

- `GET /settings/public` - Configuración pública (nombre club, etc.)
- `GET /settings/` - Todas las configuraciones (admin)
- `PUT /settings/` - Actualizar configuraciones (admin)

---

## 🔐 Autenticación y Seguridad

### Flujo de Autenticación

```
1. Usuario ingresa credenciales
   POST /auth/login
   └─ Email + Password

2. Backend valida
   ├─ Busca usuario
   ├─ Compara password (bcryptjs)
   └─ Si es válido → genera tokens

3. Genera Token Pair
   ├─ Access Token (JWT 60m dev / 15m prod)
   │  └─ Payload: {sub, email, role}
   └─ Refresh Token (7 días, persistido en BD)
      └─ Token hash guardado en refresh_tokens

4. Respuesta al cliente
   └─ accessToken, refreshToken, expiresIn

5. Cliente almacena
   ├─ accessToken → localStorage
   └─ refreshToken → httpOnly cookie (recomendado)

6. Requests subsecuentes
   ├─ Header: Authorization: Bearer {accessToken}
   └─ Middleware valida JWT

7. Renovación de tokens (rotación)
   POST /auth/refresh
   ├─ Verifica JWT expirado
   ├─ Busca refresh token en BD
   ├─ Genera nuevo par
   ├─ Revoca anterior
   └─ Devuelve nuevos tokens

8. Logout
   POST /auth/logout (requiere auth)
   └─ Revoca todos los refresh tokens del usuario
```

### Seguridad

- **bcryptjs**: Hashing de contraseñas (12 rounds prod, 4 rounds test)
- **JWT**: Tokens con expiración
- **Token Rotation**: Refresh tokens rotados en cada renovación
- **Token Hashing**: Refresh tokens hasheados en BD (SHA-256)
- **CORS**: Habilitado solo para orígenes configurados
- **Rate Limiting**: Configurable vía `RATE_LIMIT_*` env vars (default: 100 req/15 min)
- **Helmet**: Headers de seguridad HTTP
- **Compression**: Respuestas comprimidas con gzip
- **Request Context**: Request ID único por petición (X-Request-Id)
- **Input Validation**: Zod en todos los endpoints
- **RLS**: Row Level Security en Supabase
- **HTTPS**: Obligatorio en producción

### RBAC (Role-Based Access Control)

```
admin
├─ Acceso a todo el sistema
├─ Gestionar usuarios
├─ Crear/verificar jugadores
├─ Publicar resultados
└─ Configuración del club

coach
├─ Ver jugadores
├─ Crear/editar partidos
├─ Crear convocatorias
├─ Crear avisos
└─ Gestionar galería

parent
├─ Ver solo sus jugadores
└─ Ver información pública
```

---

## ⚙️ Configuración del Ambiente

### Variables de Ambiente - Backend

```env
# Ambiente
NODE_ENV=development|test|production

# Servidor
PORT=3001 (dev), 3002 (test)
API_PREFIX=/api/v1

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyXxx...
SUPABASE_SERVICE_ROLE_KEY=eyXxx...

# JWT
JWT_SECRET=tu-secret-seguro-aqui (min 32 chars)
JWT_EXPIRES_IN=60m (dev), 15m (prod)
JWT_REFRESH_SECRET=tu-refresh-secret-aqui (min 32 chars)
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173 (dev), https://barcelonamty.com (prod)

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000 (15 min)
RATE_LIMIT_MAX_REQUESTS=100

# Bcrypt
BCRYPT_ROUNDS=10 (dev), 4 (test), 12 (prod)

# Logging
LOG_LEVEL=debug (dev), info (prod)
LOG_FORMAT=pretty (dev), json (prod)

# Storage (Supabase Buckets)
STORAGE_BUCKET_PLAYERS=players-avatars
STORAGE_BUCKET_GALLERY=gallery
STORAGE_BUCKET_NOTICES=notices-covers
STORAGE_MAX_FILE_SIZE=5242880 (5MB)
```

### Variables de Ambiente - Frontend

```env
VITE_API_URL=http://localhost:3001 (dev)
VITE_API_URL=https://api.barcelonamty.com (prod)
VITE_APP_NAME=Academia Barcelona
```

---

## 📦 Instrucciones de Instalación

### Requisitos Previos

- **Node.js** 20+
- **npm** 10+
- **Cuenta Supabase** (free tier funciona)
- **Git**

### Instalación - Backend

```bash
# 1. Navegar al directorio backend
cd backend

# 2. Instalar dependencias
npm install

# 3. Configurar variables de ambiente
cp .env.example .env.development
# Editar .env.development con credenciales Supabase

# 4. Compilar TypeScript
npm run build

# 5. Ejecutar migraciones BD (si existen)
# (Por ahora manual via dashboard Supabase)

# 6. Cargar seed data
# Copiar contenido de database/seed.sql
# Ejecutar en SQL Editor de Supabase dashboard
```

### Instalación - Frontend

```bash
# 1. Navegar al directorio frontend
cd frontend

# 2. Instalar dependencias
npm install

# 3. Configurar variables de ambiente
cp .env.example .env.development
# Editar .env.development si es necesario

# 4. Generar build de TypeScript
npm run typecheck
```

### Instalación - Base de Datos

```bash
# 1. Ir a Supabase dashboard
# 2. Seleccionar tu proyecto
# 3. Ir a SQL Editor
# 4. Crear nueva query
# 5. Copiar contenido completo de database/schema.sql
# 6. Ejecutar (Ctrl+Enter)
# 7. Crear nueva query
# 8. Copiar contenido de database/seed.sql
# 9. Ejecutar (Ctrl+Enter)
```

---

## 🚀 Instrucciones de Desarrollo

### Iniciar Backend

```bash
cd backend
npm run dev

# El servidor estará disponible en:
# http://localhost:3001

# Health check:
# curl http://localhost:3001/health
```

### Iniciar Frontend

```bash
cd frontend
npm run dev

# La aplicación estará disponible en:
# http://localhost:5173

# Vite proxy redirige /api a backend
```

### Testing - Backend

```bash
cd backend

# Ejecutar todos los tests
npm test

# Con watch mode
npm test -- --watch

# Con coverage
npm run test:coverage
```

### Linting - Frontend

```bash
cd frontend

# Validar tipos
npm run typecheck

# Lint (en el futuro)
npm run lint
```

### Build para Producción

```bash
# Backend
cd backend
npm run build
# Output: dist/

# Frontend
cd frontend
npm run build
# Output: dist/
```

---

## 📚 Convenciones de Código

### Backend

- **Naming**: camelCase para variables, PascalCase para clases/tipos
- **Estructura**: 1 router, 1 controller, 1 service, 1 validation por módulo
- **Error Handling**: Custom error classes con mensajes claros
- **Logging**: Winston con contexto (userId, module, etc.)
- **Database**: Siempre usar `supabaseAdmin` en service layer
- **Tipos**: Interfaces en `@shared/types`, no en módulos

### Frontend

- **Naming**: camelCase para variables, PascalCase para componentes
- **Componentes**: Uno por archivo, functional components con hooks
- **State**: React Query para servidor, Context API para UI global
- **Styles**: Tailwind CSS solo, no CSS modules
- **Tipos**: Interfaces en `src/types`, colocalizadas si es específico

---

## 🔗 URLs y Contactos

- **Supabase Dashboard**: https://supabase.com/dashboard
- **GitHub Repo**: (por definir)
- **Documentación API**: /docs (por implementar Swagger)
- **Contacto Tech**: dev@barcelonamty.com

---

## 📝 Notas Importantes

1. **Datos de Prueba**:
   - Admin: `admin@barcelonamty.com` / `Password123!`
   - Todos los usuarios de prueba usan: `Password123!`

2. **Temporada**: Sistema codificado para `2024-2025` en `src/config/constants.ts`

3. **Soft Deletes**: Todos los queries **deben** filtrar `deleted_at IS NULL`

4. **RLS**: Las políticas de RLS están habilitadas pero el backend usa `supabaseAdmin`

5. **QR Tokens**: Generados automáticamente via RPC `generate_player_qr_token(player_id)`

6. **Ambiente Test**: Usa bcrypt_rounds=4 para tests más rápidos

---

**Versión**: 1.1.0  
**Última actualización**: 2026-05-12  
**Mantenedor**: Dev Team - Academia FC Barcelona
