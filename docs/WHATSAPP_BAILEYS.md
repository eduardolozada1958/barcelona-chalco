# WhatsApp (Baileys) en Render

Avisos del club al número secundario. No es envío masivo: solo padres **verificados** que activan la opción en el panel.

## 1. Supabase

Ejecuta en SQL Editor:

`database/migrations/20260605_parents_whatsapp_notify.sql`

## 2. Migraciones Supabase

1. `20260605_parents_whatsapp_notify.sql`  
2. `20260606_whatsapp_auth_supabase.sql` ← sesión WhatsApp (para **plan Free**)

## 3. Variables en Render (backend)

| Variable | Ejemplo | Notas |
|----------|---------|--------|
| `WHATSAPP_ENABLED` | `true` | Activa el módulo |
| `WHATSAPP_AUTH_STORAGE` | `supabase` | **Default.** Sesión en BD; no necesitas disco en Free |
| `WHATSAPP_SEND_DELAY_MS` | `4000` | Pausa entre mensajes (ms) |
| `WHATSAPP_MAX_PER_HOUR` | `40` | Tope por hora |
| `WHATSAPP_NOTIFY_MATCHES` | `true` | Aviso al crear partido programado |

### Plan Free (sin disco)

- Deja `WHATSAPP_AUTH_STORAGE=supabase` (o no la pongas; es el default).  
- Escaneas el QR **una vez**; la sesión se guarda en `whatsapp_auth_files`.  
- Tras dormir/reiniciar Render, al despertar **reconecta solo** (puede tardar ~30–60 s la primera petición).

### Plan de pago (opcional)

Si tienes disco persistente puedes usar `WHATSAPP_AUTH_STORAGE=disk` y `WHATSAPP_AUTH_DIR=/data/whatsapp-auth`.

## 4. Vincular el número secundario

1. Deploy con `WHATSAPP_ENABLED=true`  
2. Entra como admin → **WhatsApp** en el menú  
3. Escanea el QR con el teléfono secundario (Dispositivos vinculados)  
4. Estado **Conectado** → **Enviar prueba**

## 5. Padres

En **Inicio** o **Mis jugadores** (bloque de cuotas): activar «Avisos del club por WhatsApp».

Requisitos: correo verificado, cuenta activa, hijo vinculado aprobado, teléfono en `phone_primary` del padre.

## 6. Cuándo se envía

- Al **publicar** avisos tipo: urgente, partido, entrenamiento, evento  
- Al **crear** un partido con estado `scheduled` y fecha futura (si `WHATSAPP_NOTIFY_MATCHES` no es `false`)
