import { Link } from 'react-router-dom';

import { LegalPageShell } from '@/components/LegalPageShell';
import { CLUB_LEGAL_NAME, CLUB_SITE_URL } from '@/config/club';

export function PrivacyPolicyPage() {
  return (
    <LegalPageShell title="Política de privacidad">
      <section>
        <h2>1. Responsable del tratamiento</h2>
        <p>
          Los datos personales tratados a través de {CLUB_SITE_URL} se gestionan en el marco de las
          actividades de <strong>{CLUB_LEGAL_NAME}</strong> (la «academia» o el «club»), con fines
          administrativos, deportivos y de comunicación con padres, tutores y jugadores.
        </p>
        <p>
          Para dudas sobre privacidad puedes usar la página de{' '}
          <Link to="/contacto" className="text-primary hover:underline">
            contacto
          </Link>{' '}
          del sitio.
        </p>
      </section>

      <section>
        <h2>2. Qué datos se recogen</h2>
        <p>Según el uso del sitio, pueden tratarse, entre otros:</p>
        <ul>
          <li>Datos de jugadores: nombre, fecha de nacimiento, foto, posición, categoría y documentación que el club solicite para registro interno.</li>
          <li>Datos de padres o tutores: nombre, correo y teléfono cuando se registran o solicitan información.</li>
          <li>Datos de cuenta: correo y credenciales de acceso para personal autorizado del club (administración, entrenadores).</li>
          <li>Datos técnicos: dirección IP, tipo de navegador y registros básicos del servidor para seguridad y funcionamiento.</li>
          <li>Notificaciones push (opcional): identificador de suscripción del navegador, solo si el usuario activa avisos.</li>
        </ul>
      </section>

      <section>
        <h2>3. Finalidades</h2>
        <ul>
          <li>Gestionar plantilla, partidos, resultados, avisos y galería del club.</li>
          <li>Mostrar información pública autorizada (jugadores verificados, resultados publicados, comunicados).</li>
          <li>Validar credenciales digitales mediante código QR.</li>
          <li>Enviar avisos del club a quien active notificaciones en su dispositivo.</li>
          <li>Proteger el sitio frente a usos indebidos.</li>
        </ul>
        <p>
          <strong>No vendemos</strong> datos personales a terceros con fines comerciales.
        </p>
      </section>

      <section>
        <h2>4. Base y conservación</h2>
        <p>
          El tratamiento se basa en el interés legítimo del club, en la ejecución de la relación con padres y
          jugadores, y en el consentimiento cuando corresponda (por ejemplo, notificaciones push o cookies no
          esenciales).
        </p>
        <p>
          Los datos se conservan mientras sean necesarios para las finalidades indicadas y las obligaciones
          del club, y después se eliminan o anonimizan cuando ya no proceda.
        </p>
      </section>

      <section>
        <h2>5. Encargados y transferencias</h2>
        <p>
          El sitio puede apoyarse en proveedores de infraestructura (alojamiento web, base de datos en la
          nube, almacenamiento de archivos). Esos proveedores actúan como encargados con medidas de seguridad
          razonables y solo procesan datos según instrucciones del club.
        </p>
      </section>

      <section>
        <h2>6. Derechos de las personas</h2>
        <p>
          Conforme a la legislación mexicana aplicable (incluida la LFPDPPP), puedes solicitar acceso,
          rectificación, cancelación u oposición respecto de tus datos, o revocar consentimientos otorgados,
          escribiendo al club por los medios de{' '}
          <Link to="/contacto" className="text-primary hover:underline">
            contacto
          </Link>
          . Responderemos en plazos razonables.
        </p>
      </section>

      <section>
        <h2>7. Menores de edad</h2>
        <p>
          La información de jugadores menores debe ser proporcionada y supervisada por padres o tutores
          legales. El club limita la exposición pública a lo necesario para fines deportivos y de identidad
          dentro del sitio.
        </p>
      </section>

      <section>
        <h2>8. Cambios</h2>
        <p>
          Podemos actualizar esta política. La fecha de revisión aparece al inicio de la página. El uso
          continuado del sitio implica conocer la versión vigente.
        </p>
      </section>
    </LegalPageShell>
  );
}
