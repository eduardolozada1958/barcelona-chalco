# Auditoría de seguridad — Academia Barcelona API

**Fecha:** 2026-05-26  
**Alcance:** Backend Express (`backend/src`), endpoints públicos y panel admin.

## Resumen ejecutivo

| Severidad | Hallazgo | Estado |
|-----------|----------|--------|
| Alta | Caché JWT ignoraba `status` / `payment_hold` hasta 45s | **Corregido** |
| Media | Portada de avisos sin validación magic-bytes | **Corregido** |
| Media | Enumeración de emails en login/registro | **Mitigado** |
| Media | `/health` y push subscribe sin rate limit dedicado | **Corregido** |
| Baja | CORS filtraba origen en mensaje de error (prod) | **Corregido** |
| Info | Sin SQL crudo en app (Supabase JS) | OK |
| Info | Helmet + cabeceras OWASP + Zod en body/params | OK |

## Controles existentes (positivos)

- **Autenticación:** JWT 15m, refresh rotativo, bcrypt, lockout 5 intentos, 2FA TOTP opcional.
- **Autorización:** `requireAdmin`, `requireCoach`, `requireParent` por ruta.
- **Rate limiting:** Global, write, auth (30/15min), lecturas públicas (300/15min), inscripciones (10/h), vínculos CURP (15/15min).
- **Validación:** Zod en body/params/query; sanitización PostgREST (`sanitize-search.ts`).
- **Subidas:** Magic bytes PNG/JPEG/WebP y PDF en jugadores, galería, avatares, logos.
- **Errores:** Sin stack en producción.
- **Tests:** `npm run test:security` + script Python `scripts/security/pentest.py`.

## Cómo ejecutar pruebas

```bash
# Tests automatizados (Jest)
cd backend && npm run test:security

# Pentest black-box (solo tu API / con autorización)
pip install -r scripts/security/requirements.txt
python scripts/security/pentest.py --base-url http://localhost:3001
python scripts/security/pentest.py --base-url https://barcelona-chalco.onrender.com --skip-rate
```

## Recomendaciones implementadas (2026-05-26)

1. **Cloudflare WAF** — Worker proxy en `cloudflare/api-proxy/` + guía `docs/CLOUDFLARE_WAF_SETUP.md`
2. **RLS Supabase** — Migración `20260616_rls_gaps_hardening.sql` (tablas faltantes + deny policies)
3. **Rotación JWT 90 días** — `JWT_*_PREVIOUS`, `JWT_*_ROTATED_AT`, aviso al arranque; guía `docs/JWT_ROTATION.md`
4. **Alertas 401/429** — `security-alert.middleware.ts` + webhook opcional `SECURITY_ALERT_WEBHOOK_URL`
5. **UUID / tokens** — `common-params.ts`, validación QR routes, resto de rutas ya usan Zod UUID

## Recomendaciones pendientes (infra)

1. **WAF / Cloudflare** delante del API en Render para mitigar DDoS volumétrico.
2. **Rotación de secretos** JWT y Supabase service role cada 90 días.
3. **RLS en Supabase** como defensa en profundidad (el backend usa service role).
4. **Monitoreo** de 429 y 401 masivos (alertas en Render/Datadog).
5. Ejecutar migración `20260615_whatsapp_delivery_audit.sql` si no está aplicada.

## Endpoints públicos (superficie de ataque)

Revisar periódicamente: `/auth/*`, `/players/public`, `/inscriptions/public`, `/qr/validate/:token`, `/push/public/*`, `/comments/public`.
