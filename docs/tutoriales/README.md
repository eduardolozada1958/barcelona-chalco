# Tutoriales F.C. Barcelona Cupido

Guías en Markdown para **imprimir, exportar a PDF o compartir** con padres, entrenadores y administración.

**Sitio:** https://barcelona-chalco.pages.dev  
**Panel privado:** https://barcelona-chalco.pages.dev/login → tras iniciar sesión, `/dashboard`

---

## Archivos

| Archivo | Para quién |
|---------|------------|
| [INSTALAR_APP.md](./INSTALAR_APP.md) | Todos: instalar el sitio como app (Android, iPhone, iPad, computadora) |
| [TUTORIAL_PADRES.md](./TUTORIAL_PADRES.md) | Padres y tutores: registro, hijos, avisos, WhatsApp, cuotas |
| [TUTORIAL_ADMIN.md](./TUTORIAL_ADMIN.md) | Administradores: plantilla, partidos, avisos, usuarios, WhatsApp del club |
| [TUTORIAL_ENTRENADOR.md](./TUTORIAL_ENTRENADOR.md) | Entrenadores: operación diaria (sin usuarios ni ajustes globales) |

Documentación técnica adicional en `docs/` (por ejemplo [WHATSAPP_BAILEYS.md](../WHATSAPP_BAILEYS.md)).

---

## Cómo exportar a PDF

1. Abre el `.md` en VS Code, Cursor o [StackEdit](https://stackedit.io).
2. Vista previa → **Imprimir** → «Guardar como PDF».

O con [Pandoc](https://pandoc.org) (si lo tienes instalado):

```bash
pandoc docs/tutoriales/TUTORIAL_PADRES.md -o Tutorial-Padres.pdf
```

---

## Guía dentro del sitio

Los usuarios con sesión también tienen **Dashboard → Guía de uso** (`/dashboard/guia`), con pasos según su rol (padre, entrenador o admin).

Estos archivos `.md` son la versión **ampliada** (instalación de app, iOS, WhatsApp, etc.) para entregar por WhatsApp, correo o impresión.

Incluyen **capturas de pantalla** en `img/` (sitio en producción).

---

## Regenerar capturas

Desde la raíz del proyecto (requiere Node y Playwright instalado):

```bash
npm run tutorials:capture
```

Variables opcionales:

| Variable | Uso |
|----------|-----|
| `TUTORIAL_BASE_URL` | URL del sitio (por defecto `https://barcelona-chalco.pages.dev`) |
| `TUTORIAL_PARENT_EMAIL` | Cuenta padre para el panel |
| `TUTORIAL_ADMIN_EMAIL` | Cuenta admin (WhatsApp y secciones solo admin) |
| `TUTORIAL_COACH_EMAIL` | Cuenta entrenador (respaldo si admin no entra) |
| `TUTORIAL_PASSWORD` | Contraseña de esas cuentas |

Si el admin de producción no usa la contraseña del seed, define `TUTORIAL_ADMIN_EMAIL` y `TUTORIAL_PASSWORD` antes de ejecutar el script para obtener la captura de **WhatsApp** (`img/admin/23-whatsapp.png`).

Las capturas de **«Añadir a pantalla de inicio»** en iPhone deben hacerse manualmente en un iPhone con Safari.
