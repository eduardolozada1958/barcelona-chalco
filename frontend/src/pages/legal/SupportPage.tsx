import { Link } from 'react-router-dom';

import { LegalPageShell } from '@/components/LegalPageShell';
import { MaterialIcon } from '@/components/MaterialIcon';
import { CLUB_DISPLAY_NAME } from '@/config/club';

const COACH_PHONE_DISPLAY = '+52 1 56 3233 2292';
const COACH_PHONE_TEL = '+5215632332292';

export function SupportPage() {
  return (
    <LegalPageShell title="Soporte">
      <section>
        <h2>¿En qué podemos ayudarte?</h2>
        <p>
          <strong>{CLUB_DISPLAY_NAME}</strong> es una plataforma web para consultar estadísticas, partidos y
          avisos. Según tu necesidad, usa el canal adecuado:
        </p>
      </section>

      <section className="rounded-xl border border-primary/25 bg-primary/5 p-5 space-y-3">
        <h2 className="!mt-0 flex items-center gap-2 text-primary">
          <MaterialIcon name="sports" size={22} />
          Academia, horarios e inscripciones
        </h2>
        <p>
          Para entrenamientos, inscripciones o temas de la academia, contacta al entrenador:
        </p>
        <p>
          <a href={`tel:${COACH_PHONE_TEL}`} className="text-primary font-semibold text-lg hover:underline">
            {COACH_PHONE_DISPLAY}
          </a>
        </p>
        <Link
          to="/contacto"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-label-caps"
        >
          Ir a la página de contacto →
        </Link>
      </section>

      <section>
        <h2>Problemas con el sitio web</h2>
        <ul>
          <li>Recarga con Ctrl+F5 (o vacía caché en el móvil).</li>
          <li>Comprueba tu conexión a internet.</li>
          <li>Goles y tarjetas: deben guardarse en Resultados y el partido debe estar publicado.</li>
          <li>Notificaciones: activa «Activar avisos» y permite notificaciones en el navegador.</li>
          <li>Credenciales QR: usa «Validar jugador» en el menú.</li>
        </ul>
        <p className="text-sm opacity-90">
          Si el fallo continúa, describe el problema (pantalla, navegador y hora) al contactar por los medios
          anteriores.
        </p>
      </section>

      <section>
        <h2>Privacidad y cuentas</h2>
        <p>
          Dudas sobre datos:{' '}
          <Link to="/privacidad" className="text-primary hover:underline">
            política de privacidad
          </Link>
          . Las cuentas del panel las gestiona quien administra el sitio.
        </p>
      </section>

      <section>
        <h2>Horario de respuesta</h2>
        <p>
          Se responderá en la medida de lo posible en días y horarios de actividad de la academia. El sitio no
          ofrece soporte 24/7.
        </p>
      </section>
    </LegalPageShell>
  );
}
