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
          Este sitio es operado por <strong>{CLUB_DISPLAY_NAME}</strong>. Según tu necesidad, usa el canal
          adecuado:
        </p>
      </section>

      <section className="rounded-xl border border-primary/25 bg-primary/5 p-5 space-y-3">
        <h2 className="!mt-0 flex items-center gap-2 text-primary">
          <MaterialIcon name="sports" size={22} />
          Academia, horarios e inscripciones
        </h2>
        <p>
          Para información sobre entrenamientos, inscripciones o temas del club, contacta al entrenador por
          teléfono o WhatsApp:
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
          <li>Recarga la página con Ctrl+F5 (o vacía caché en el móvil).</li>
          <li>Comprueba tu conexión a internet.</li>
          <li>Si no ves goles o tarjetas actualizados, el club debe guardarlos en Resultados y publicar el partido.</li>
          <li>Si las notificaciones no llegan, revisa que hayas pulsado «Activar avisos» y que el navegador permita notificaciones.</li>
          <li>Para credenciales QR, usa la opción «Validar jugador» desde el menú.</li>
        </ul>
        <p className="text-sm opacity-90">
          Si el fallo continúa, describe el problema (pantalla, navegador y hora) al contactar al club por los
          medios anteriores; el personal autorizado puede escalarlo con quien mantenga la plataforma.
        </p>
      </section>

      <section>
        <h2>Privacidad y cuentas</h2>
        <p>
          Dudas sobre datos personales: revisa la{' '}
          <Link to="/privacidad" className="text-primary hover:underline">
            política de privacidad
          </Link>
          . Las cuentas del panel solo las gestiona el club; no hay registro público de padres salvo lo que el
          club indique.
        </p>
      </section>

      <section>
        <h2>Horario de respuesta</h2>
        <p>
          El club responderá en la medida de sus posibilidades en días y horarios de actividad de la academia.
          El sitio no ofrece soporte telefónico 24/7.
        </p>
      </section>
    </LegalPageShell>
  );
}
