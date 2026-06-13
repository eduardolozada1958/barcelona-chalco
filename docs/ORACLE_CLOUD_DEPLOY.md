# Backend en Oracle Cloud Free (Monterrey)

Migración desde Render → VM **Always Free** (Ampere ARM) + front en **Cloudflare Pages** (sin cambios).

## Resumen del flujo

```
Usuario → barcelona-chalco.pages.dev/api/*
       → Cloudflare Function → Worker WAF → http://IP_ORACLE/health
       → Nginx :80 → Node :3001
```

---

## Paso 1 — Crear la VM (consola Oracle)

1. Menú **☰ → Compute → Instances → Create instance**
2. **Name:** `barcelona-api`
3. **Placement:** Mexico Northeast (Monterrey) — ya lo tienes
4. **Image:** Ubuntu 22.04 or 24.04 (**aarch64**)
5. **Shape:** **Ampere** → `VM.Standard.A1.Flex`
   - **OCPU:** 1
   - **Memory:** 6 GB (suficiente para Node + WhatsApp)
   - Debe decir **Always Free-eligible**
6. **Networking:** deja la VCN por defecto; marca **Assign a public IPv4 address**
7. **SSH keys:** sube tu clave pública (o genera par y guarda la `.pem`)
8. **Boot volume:** 50 GB (default)
9. **Create**

Anota la **IP pública** (ej. `132.xxx.xxx.xxx`).

---

## Paso 2 — Abrir puertos (firewall Oracle)

1. En la instancia → enlace **Subnet** → **Default Security List**
2. **Add Ingress Rules:**

| Source | Protocol | Port | Descripción |
|--------|----------|------|-------------|
| `0.0.0.0/0` | TCP | 22 | SSH (mejor tu IP en prod) |
| `0.0.0.0/0` | TCP | 80 | HTTP (Worker → API) |

3. Guarda.

En la VM (Ubuntu), si hay firewall local:

```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 22 -j ACCEPT
# Persistir (Ubuntu Oracle):
sudo apt-get install -y iptables-persistent
```

---

## Paso 3 — Conectar por SSH

Windows (PowerShell):

```powershell
ssh -i "C:\ruta\a\tu-clave.pem" ubuntu@TU_IP_PUBLICA
```

---

## Paso 4 — Instalar app en la VM

```bash
curl -sSL https://raw.githubusercontent.com/eduardolozada1958/barcelona-chalco/main/deploy/oracle/setup-vm.sh | bash
```

Crea el archivo de entorno (copia **todas** las variables de Render → Environment):

```bash
nano ~/barcelona/backend/.env.production
```

**Mínimo a revisar/cambiar:**

```env
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://barcelona-chalco.pages.dev
APP_PUBLIC_URL=https://barcelona-chalco.pages.dev
WHATSAPP_AUTH_STORAGE=disk
WHATSAPP_AUTH_DIR=/home/ubuntu/barcelona-data/whatsapp-auth
```

Pega también: `SUPABASE_*`, `JWT_*`, `BREVO_*`, `WHATSAPP_*`, `VAPID_*`, etc.

Instala y arranca:

```bash
bash ~/barcelona/deploy/oracle/install-app.sh
curl -s http://127.0.0.1/health
curl -s http://TU_IP_PUBLICA/health
```

Debe responder `"status":"ok"`.

Logs:

```bash
sudo journalctl -u barcelona-api -f
```

---

## Paso 5 — Apuntar Cloudflare al Oracle (no Render)

En tu PC (donde tienes `wrangler` logueado):

```bash
cd cloudflare/api-proxy
npx wrangler secret put RENDER_ORIGIN
# Valor: http://TU_IP_PUBLICA   (sin barra final, sin /api)
npx wrangler deploy
```

Prueba:

```bash
curl -s https://barcelona-api-proxy.eduardolozada1958.workers.dev/health
```

El front en Pages **no cambia** (sigue usando `/api/v1` vía Function → Worker).

---

## Paso 6 — WhatsApp en Oracle

1. Panel admin → WhatsApp → escanear QR de nuevo (sesión nueva en disco).
2. Si usabas sesión en Supabase en Render, puede hacer falta **Reset session** y QR otra vez.

---

## Paso 7 — Apagar Render (cuando todo funcione)

1. Verifica login, asistencia, avisos, un mensaje WA de prueba.
2. Render Dashboard → servicio `barcelona-chalco-backend` → **Suspend** o elimina.

---

## Actualizar código después

```bash
ssh ubuntu@TU_IP
cd ~/barcelona && git pull
cd backend && npm ci --include=dev && npm run build && npm prune --omit=dev
sudo systemctl restart barcelona-api
```

---

## Problemas frecuentes

| Síntoma | Solución |
|---------|----------|
| `curl IP/health` timeout | Revisa Security List puerto 80 + iptables |
| 502 Bad Gateway | `sudo systemctl status barcelona-api` — fallo env o build |
| CORS error | `CORS_ORIGIN=https://barcelona-chalco.pages.dev` |
| WhatsApp no conecta | `WHATSAPP_AUTH_STORAGE=disk` y carpeta con permisos |
| Shape A1 no disponible | Prueba otra hora o región (Phoenix) — home region no cambia |

---

## Coste

Always Free Ampere: **$0** si no pasas límites (1 VM 1 OCPU / 6 GB suele caber). Tráfico saliente Oracle tiene cupo generoso vs Render free.
