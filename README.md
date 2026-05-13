# ⚽ Academia FC Barcelona

Plataforma profesional de gestión integral para una academia de fútbol juvenil.

## Stack

| Capa | Tecnología |
|------|-----------|
| **Backend** | Node.js + Express + TypeScript + Supabase |
| **Frontend** | React + Vite + TypeScript + Tailwind CSS |
| **Base de Datos** | PostgreSQL 15+ (Supabase managed) |

## Estructura

```
barcelona/
├─ backend/     # API REST (Express + TypeScript)
├─ frontend/    # SPA (React + Vite)
├─ database/    # schema.sql + seed.sql
└─ ARCHITECTURE.md
```

## Inicio rápido

### Backend

```bash
cd backend
npm install
cp .env.example .env.development
# Editar .env.development con credenciales Supabase
npm run dev
# → http://localhost:3001/health
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.development
npm run dev
# → http://localhost:5173
```

### Base de datos

1. Crear proyecto en [Supabase](https://supabase.com)
2. Ejecutar `database/schema.sql` en SQL Editor
3. Ejecutar `database/seed.sql` para datos de prueba

## Credenciales de prueba

- **Admin**: `admin@barcelonamty.com` / `Password123!`

## Documentación

Ver [ARCHITECTURE.md](./ARCHITECTURE.md) para documentación completa del sistema.
