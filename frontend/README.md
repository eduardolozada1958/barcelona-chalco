# Frontend - Academia FC Barcelona

SPA construida con **React + TypeScript + Vite + Tailwind CSS**.

## Comandos

```bash
npm run dev        # Desarrollo (Vite HMR)
npm run build      # Build producción
npm run preview    # Preview del build
npm run typecheck  # Verificar tipos
npm run lint       # ESLint
```

## Configuración

```bash
cp .env.example .env.development
```

Variables disponibles:
- `VITE_API_URL` — URL del backend API

## Estructura

```
src/
├─ components/   # ProtectedRoute, Spinner
├─ pages/        # Páginas públicas + dashboard/
├─ layouts/      # PublicLayout, DashboardLayout
├─ contexts/     # AuthContext
├─ api/          # Servicios HTTP (Axios)
├─ types/        # TypeScript interfaces
├─ utils/        # Constantes y utilidades
├─ App.tsx       # Rutas
└─ main.tsx      # Entry point
```

## Colores corporativos

- Dorado: `#D4AF37`
- Azul Oscuro: `#0F3460`
- Negro: `#1A1A2E`
