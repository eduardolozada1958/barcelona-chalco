import { Link } from 'react-router-dom';

import { LegalPageShell } from '@/components/LegalPageShell';
import { CLUB_DISPLAY_NAME, CLUB_SITE_URL, SITE_LEGAL_DISCLAIMER } from '@/config/club';

export function PrivacyPolicyPage() {
  return (
    <LegalPageShell title="Política de privacidad">
      <section>
        <h2>1. Responsable del tratamiento</h2>
        <p>{SITE_LEGAL_DISCLAIMER}</p>
        <p>
          Los datos personales tratados a través de {CLUB_SITE_URL} («el sitio») se gestionan en el marco de
          la plataforma <strong>{CLUB_DISPLAY_NAME}</strong>, con fines de información deportiva,
          comunicación con padres, tutores y jugadores, y administración del contenido publicado en el sitio.
        </p>
        <p>
          El responsable del tratamiento es quien opera y administra el sitio (personal autorizado y
          contacto indicado en{' '}
          <Link to="/contacto" className="text-primary hover:underline">
            contacto
          </Link>
          ), no los proveedores técnicos de alojamiento por sí solos.
        </p>
      </section>

      <section>
        <h2>2. Qué datos se recogen</h2>
        <p>Según el uso del sitio, pueden tratarse, entre otros:</p>
        <ul>
          <li>Datos de jugadores: nombre, fecha de nacimiento, foto, posición, categoría y documentación solicitada para registro interno.</li>
          <li>Datos de padres o tutores: nombre, correo y teléfono cuando solicitan información.</li>
          <li>Datos de cuenta: correo y credenciales para personal autorizado (administración, entrenadores).</li>
          <li>Datos técnicos: dirección IP, tipo de navegador y registros básicos del servidor.</li>
          <li>Notificaciones push (opcional): identificador de suscripción del navegador, solo si activas avisos.</li>
        </ul>
      </section>

      <section>
        <h2>3. Finalidades</h2>
        <ul>
          <li>Mostrar plantilla, partidos, resultados, avisos y galería publicados en el sitio.</li>
          <li>Mostrar estadísticas básicas (goles, asistencias, tarjetas) de partidos con resultado publicado.</li>
          <li>Validar credenciales digitales mediante código QR.</li>
          <li>Enviar avisos a quien active notificaciones en su dispositivo.</li>
          <li>Proteger el sitio frente a usos indebidos.</li>
        </ul>
        <p>
          <strong>No vendemos</strong> datos personales a terceros con fines comerciales.
        </p>
      </section>

      <section>
        <h2>4. Base y conservación</h2>
        <p>
          El tratamiento se basa en el interés legítimo de operar el sitio, en la relación con padres y
          jugadores vinculados a la academia, y en el consentimiento cuando corresponda (notificaciones push,
          etc.).
        </p>
        <p>
          Los datos se conservan mientras sean necesarios para las finalidades indicadas y después se
          eliminan o anonimizan cuando ya no proceda.
        </p>
      </section>

      <section>
        <h2>5. Encargados y transferencias</h2>
        <p>
          El sitio puede usar proveedores de infraestructura (alojamiento, base de datos, almacenamiento de
          archivos). Actúan como encargados con medidas razonables y solo procesan datos según instrucciones
          del responsable del sitio.
        </p>
      </section>

      <section>
        <h2>6. Derechos de las personas</h2>
        <p>
          Conforme a la legislación mexicana aplicable (LFPDPPP), puedes solicitar acceso, rectificación,
          cancelación u oposición, o revocar consentimientos, mediante{' '}
          <Link to="/contacto" className="text-primary hover:underline">
            contacto
          </Link>
          . Responderemos en plazos razonables.
        </p>
      </section>

      <section>
        <h2>7. Menores de edad</h2>
        <p>
          La información de jugadores menores debe ser supervisada por padres o tutores. La exposición
          pública se limita a lo necesario para fines deportivos e identidad dentro del sitio.
        </p>
      </section>

      <section>
        <h2>8. Cambios</h2>
        <p>
          Podemos actualizar esta política. La fecha de revisión aparece al inicio. El uso continuado implica
          conocer la versión vigente.
        </p>
      </section>
    </LegalPageShell>
  );
}
