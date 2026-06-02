# Cloudflare WAF delante del API (Render)

Objetivo: mitigar DDoS volumétrico, filtrar patrones obvios y ocultar el origen Render.

## Opción A — Worker proxy (recomendado, incluido en repo)

Código: `cloudflare/api-proxy/`

### 1. Desplegar Worker

```bash
cd cloudflare/api-proxy
npm install -g wrangler   # o npx wrangler
wrangler login
wrangler secret put RENDER_ORIGIN
# Valor: https://barcelona-chalco.onrender.com
wrangler deploy
```

**URL activa (desplegada):** https://barcelona-api-proxy.eduardolozada1958.workers.dev  
Ejemplo: `GET .../health` → proxy a Render (`200 OK`).

### 2. Dominio público del API

En Cloudflare DNS:

| Tipo | Nombre | Contenido | Proxy |
|------|--------|-----------|-------|
| CNAME | `api` | `barcelona-api-proxy.eduardolozada1958.workers.dev` | Proxied |

O en `wrangler.toml` descomenta `routes` con tu zona.

### 3. Frontend

Actualiza la URL del API en el front (variable `VITE_API_URL` o equivalente) a `https://api.tudominio.com`.

Render sigue siendo el origen; solo el tráfico público pasa por Cloudflare.

## Opción B — Proxy directo al host Render

1. Cloudflare DNS: CNAME `api` → `barcelona-chalco.onrender.com` (naranja / proxied).
2. Render: Custom Domain `api.tudominio.com`.
3. SSL: Full (strict) en Cloudflare.

## Reglas WAF en Dashboard (manual)

En **Security → WAF → Custom rules**:

| Regla | Expresión | Acción |
|-------|-----------|--------|
| Block SQLi URL | `http.request.uri.query contains "union select"` | Block |
| Block path traversal | `http.request.uri.path contains ".."` | Block |
| Rate limit auth | `http.request.uri.path contains "/auth/login"` | Rate limit 30/min por IP |
| Challenge bots | `cf.bot_management.score lt 30` | Managed Challenge |

## Rate limiting Cloudflare (plan Pro+)

Si tienes plan de pago: **Security → WAF → Rate limiting rules** para `/api/v1/auth/*` y `/health`.

## Verificación

```bash
curl -I https://api.tudominio.com/health
# Debe incluir cf-ray y cabeceras de seguridad
```

Script local: `python scripts/security/pentest.py --base-url https://api.tudominio.com`
