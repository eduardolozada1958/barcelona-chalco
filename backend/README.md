# Backend - Academia FC Barcelona

API REST construida con **Node.js + Express + TypeScript + Supabase**.

## Comandos

```bash
npm run dev          # Desarrollo (nodemon + ts-node)
npm run build        # Compilar TypeScript → dist/
npm start            # Producción (node dist/server.js)
npm test             # Tests (Jest)
npm run test:coverage # Tests con coverage
npm run typecheck    # Verificar tipos
npm run lint         # ESLint
```

## Configuración

```bash
cp .env.example .env.development
```

Editar con credenciales de Supabase. Ver [ARCHITECTURE.md](../ARCHITECTURE.md) para todas las variables.

## Estructura

```
src/
├─ config/        # env.ts, database.ts, constants.ts
├─ middlewares/   # auth, role, validate, error, request-context
├─ shared/        # types/, utils/
├─ modules/       # 11 módulos MVC por dominio
├─ app.ts         # Express factory
└─ server.ts      # HTTP server + entry point
```

## Módulos

auth · users · players · parents · matches · results · notices · gallery · inscriptions · qr-validation · settings
