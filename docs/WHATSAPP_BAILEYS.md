# WhatsApp (Baileys) en Render

Avisos del club al número secundario. No es envío masivo: solo padres **verificados** que activan la opción en el panel.

## 1. Supabase

Ejecuta en SQL Editor:

`database/migrations/20260605_parents_whatsapp_notify.sql`

## 2. Variables en Render (backend)

| Variable | Ejemplo | Notas |
|----------|---------|--------|
| `WHATSAPP_ENABLED` | `true` | Activa el módulo |
| `WHATSAPP_AUTH_DIR` | `/data/whatsapp-auth` | **Montar disco persistente** en Render con esta ruta |
| `WHATSAPP_SEND_DELAY_MS` | `4000` | Pausa entre mensajes (ms) |
| `WHATSAPP_MAX_PER_HOUR` | `40` | Tope por hora |
| `WHATSAPP_NOTIFY_MATCHES` | `true` | Aviso al crear partido programado |

Sin disco persistente tendrás que **volver a escanear el QR** tras cada redeploy o reinicio.

## 3. Disco persistente en Render

1. Dashboard del servicio → **Disks** → Add disk  
2. Mount path: `/data`  
3. `WHATSAPP_AUTH_DIR=/data/whatsapp-auth`

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
