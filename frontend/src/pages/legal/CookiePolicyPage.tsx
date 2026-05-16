import { Link } from 'react-router-dom';

import { LegalPageShell } from '@/components/LegalPageShell';
import { CLUB_SITE_URL } from '@/config/club';

export function CookiePolicyPage() {
  return (
    <LegalPageShell title="Política de cookies y almacenamiento local">
      <section>
        <h2>1. Qué usamos</h2>
        <p>
          En {CLUB_SITE_URL} utilizamos almacenamiento en tu navegador para que el sitio funcione. No usamos
          cookies de publicidad ni perfiles comerciales de terceros.
        </p>
      </section>

      <section>
        <h2>2. Almacenamiento esencial</h2>
        <ul>
          <li>
            <strong>Sesión de usuario (localStorage):</strong> si inicias sesión en el panel, guardamos
            tokens hasta que cierres sesión o expiren.
          </li>
          <li>
            <strong>Preferencias:</strong> por ejemplo, si cerraste el aviso de activar notificaciones push.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. Notificaciones push (opcional)</h2>
        <p>
          Solo si pulsas «Activar avisos», el navegador crea una suscripción push. Puedes desactivarla desde el
          banner o desde ajustes del sistema.
        </p>
      </section>

      <section>
        <h2>4. Service Worker</h2>
        <p>
          Para las notificaciones, el sitio registra un service worker (`sw.js`) que muestra avisos cuando se
          publican comunicados elegibles. No rastrea tu actividad fuera del sitio.
        </p>
      </section>

      <section>
        <h2>5. Proveedores de la página</h2>
        <p>
          El alojamiento (por ejemplo Cloudflare Pages) y la API pueden registrar datos técnicos mínimos por
          seguridad, no para venderte publicidad.
        </p>
      </section>

      <section>
        <h2>6. Cómo gestionar o eliminar</h2>
        <ul>
          <li>Borra datos del sitio en la configuración de tu navegador.</li>
          <li>Revoca permisos de notificaciones en Ajustes del dispositivo.</li>
          <li>Cierra sesión en el panel si usaste una cuenta autorizada.</li>
        </ul>
      </section>

      <section>
        <h2>7. Más información</h2>
        <p>
          Consulta la{' '}
          <Link to="/privacidad" className="text-primary hover:underline">
            política de privacidad
          </Link>
          .
        </p>
      </section>
    </LegalPageShell>
  );
}
