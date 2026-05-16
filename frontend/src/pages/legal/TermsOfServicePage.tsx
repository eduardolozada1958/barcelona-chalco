import { Link } from 'react-router-dom';

import { LegalPageShell } from '@/components/LegalPageShell';
import { CLUB_LEGAL_NAME, CLUB_SITE_URL } from '@/config/club';

export function TermsOfServicePage() {
  return (
    <LegalPageShell title="Términos de servicio">
      <section>
        <h2>1. Aceptación</h2>
        <p>
          Al usar {CLUB_SITE_URL} («el sitio»), aceptas estos términos. Si no estás de acuerdo, abstente de
          usar el sitio. El sitio es operado en beneficio de <strong>{CLUB_LEGAL_NAME}</strong>.
        </p>
      </section>

      <section>
        <h2>2. Naturaleza del servicio</h2>
        <p>El sitio es una herramienta informativa y de gestión interna del club que permite, entre otras cosas:</p>
        <ul>
          <li>Consultar plantilla, partidos, resultados y avisos publicados.</li>
          <li>Ver estadísticas deportivas básicas (goles, asistencias, tarjetas) derivadas de resultados registrados por el club.</li>
          <li>Validar credenciales digitales de jugadores.</li>
          <li>Gestionar contenidos mediante cuentas autorizadas del personal del club.</li>
        </ul>
        <p>
          <strong>No es</strong> un servicio médico, de scouting profesional ni de análisis biomecánico avanzado.
          Las cifras mostradas dependen de lo que el club registre y publique.
        </p>
      </section>

      <section>
        <h2>3. Cuentas y acceso</h2>
        <p>
          Las cuentas del panel administrativo están reservadas a personas autorizadas por el club. Cada
          usuario es responsable de mantener la confidencialidad de sus credenciales y de cerrar sesión en
          equipos compartidos.
        </p>
      </section>

      <section>
        <h2>4. Contenido y propiedad</h2>
        <p>
          Textos, imágenes, logos y datos publicados por el club son responsabilidad del club. No está
          permitido copiar, republicar o usar el contenido con fines comerciales ajenos al club sin
          autorización.
        </p>
        <p>
          El nombre y escudo mostrados corresponden a la academia local {CLUB_LEGAL_NAME}. Salvo indicación
          expresa del club, el sitio no pretende representar oficialmente a terceros, incluidos clubes
          profesionales con marcas registradas.
        </p>
      </section>

      <section>
        <h2>5. Disponibilidad y cambios</h2>
        <p>
          El sitio se ofrece «tal cual». Pueden producirse interrupciones por mantenimiento, actualizaciones
          o causas ajenas al club. No garantizamos disponibilidad ininterrumpida.
        </p>
      </section>

      <section>
        <h2>6. Limitación de responsabilidad</h2>
        <p>
          En la medida permitida por la ley, el club no será responsable por daños indirectos derivados del
          uso o imposibilidad de uso del sitio. Las decisiones deportivas, médicas o formativas de padres y
          jugadores no dependen únicamente de la información mostrada en la web.
        </p>
        <p>
          Los colaboradores técnicos que apoyan el desarrollo o alojamiento del sitio no asumen obligaciones
          frente a usuarios finales más allá de lo pactado con el club.
        </p>
      </section>

      <section>
        <h2>7. Enlaces externos</h2>
        <p>
          El sitio puede enlazar a servicios de terceros (por ejemplo mapas o WhatsApp). El club no controla
          esos sitios; revisa sus políticas por separado.
        </p>
      </section>

      <section>
        <h2>8. Contacto y ley aplicable</h2>
        <p>
          Para consultas usa la página de{' '}
          <Link to="/contacto" className="text-primary hover:underline">
            contacto
          </Link>
          . Estos términos se interpretan conforme a las leyes de los Estados Unidos Mexicanos, sin perjuicio
          de normas imperativas de protección al consumidor que resulten aplicables.
        </p>
      </section>
    </LegalPageShell>
  );
}
