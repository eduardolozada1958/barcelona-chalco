import { Link } from 'react-router-dom';

import { LegalPageShell } from '@/components/LegalPageShell';
import { CLUB_SITE_URL } from '@/config/club';

export function CookiePolicyPage() {
  return (
    <LegalPageShell title="Política de cookies y almacenamiento local">
      <section>
        <h2>1. Qué usamos</h2>
        <p>
          En {CLUB_SITE_URL} utilizamos tecnologías de almacenamiento en tu navegador para que el sitio
          funcione. No usamos cookies de publicidad ni perfiles comerciales de terceros.
        </p>
      </section>

      <section>
        <h2>2. Almacenamiento esencial</h2>
        <ul>
          <li>
            <strong>Sesión de usuario (localStorage):</strong> si inicias sesión en el panel, guardamos
            tokens de acceso para mantenerte autenticado hasta que cierres sesión o expiren.
          </li>
          <li>
            <strong>Preferencias del sitio:</strong> por ejemplo, si cerraste el aviso de activar
            notificaciones push.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. Notificaciones push (opcional)</h2>
        <p>
          Solo si pulsas «Activar avisos», el navegador crea una suscripción push asociada a tu dispositivo.
          Puedes desactivarla desde el mismo banner o desde la configuración de notificaciones del
          navegador/sistema.
        </p>
      </section>

      <section>
        <h2>4. Service Worker</h2>
        <p>
          Para las notificaciones, el sitio registra un service worker (`sw.js`) que muestra avisos cuando el
          club publica comunicados elegibles. No rastrea tu actividad fuera del sitio.
        </p>
      </section>

      <section>
        <h2>5. Proveedores de la página</h2>
        <p>
          El alojamiento (por ejemplo Cloudflare Pages) y la API del club pueden registrar datos técnicos
          mínimos (IP, fecha, tipo de petición) por seguridad y estadísticas de servidor, no para venderte
          publicidad.
        </p>
      </section>

      <section>
        <h2>6. Cómo gestionar o eliminar</h2>
        <ul>
          <li>Borra datos del sitio en la configuración de tu navegador (cookies y almacenamiento local).</li>
          <li>Revoca permisos de notificaciones en Ajustes → Sitios → {CLUB_SITE_URL.replace('https://', '')}.</li>
          <li>Cierra sesión en el panel si usaste una cuenta del club.</li>
        </ul>
      </section>

      <section>
        <h2>7. Más información</h2>
        <p>
          Consulta también la{' '}
          <Link to="/privacidad" className="text-primary hover:underline">
            política de privacidad
          </Link>
          .
        </p>
      </section>
    </LegalPageShell>
  );
}
