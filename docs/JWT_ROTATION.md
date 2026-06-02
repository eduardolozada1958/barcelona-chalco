# Rotación de JWT (cada ~90 días)

## Cuándo

- El backend avisa en logs si `JWT_SECRET_ROTATED_AT` supera `JWT_ROTATION_MAX_DAYS` (default 90).
- Planifica rotación **antes** de que expire el aviso crítico.

## Pasos en Render (sin cortar sesiones activas)

1. Genera un nuevo secreto:
   ```bash
   openssl rand -base64 48
   ```

2. En Render → Environment:
   - `JWT_SECRET_PREVIOUS` = valor actual de `JWT_SECRET`
   - `JWT_SECRET` = nuevo valor generado
   - `JWT_SECRET_ROTATED_AT` = fecha ISO, ej. `2026-05-26T00:00:00Z`

3. Redeploy. Los access tokens viejos (15 min) siguen válidos con `JWT_SECRET_PREVIOUS` hasta expirar.

4. Tras **7 días** (refresh max), repite para refresh:
   - `JWT_REFRESH_SECRET_PREVIOUS` = actual
   - `JWT_REFRESH_SECRET` = nuevo
   - `JWT_REFRESH_SECRET_ROTATED_AT` = fecha ISO

5. Cuando no queden tokens firmados con el secreto anterior, borra `JWT_*_PREVIOUS`.

## Local

Copia las mismas variables en `.env.production` o `.env.development`.

## Verificación

```bash
cd backend && npm run test:security
```

Tests en `tests/security/jwt-rotation.test.ts` validan verificación dual.
