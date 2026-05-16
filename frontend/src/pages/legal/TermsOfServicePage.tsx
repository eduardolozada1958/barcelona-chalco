import { Link } from 'react-router-dom';

import { LegalPageShell } from '@/components/LegalPageShell';
import { CLUB_DISPLAY_NAME, CLUB_SITE_URL, SITE_LEGAL_DISCLAIMER } from '@/config/club';

export function TermsOfServicePage() {
  return (
    <LegalPageShell title="Términos de servicio">
      <section>
        <h2>1. Aceptación</h2>
        <p>{SITE_LEGAL_DISCLAIMER}</p>
        <p>
          Al usar {CLUB_SITE_URL} («el sitio»), aceptas estos términos. Si no estás de acuerdo, no uses el
          sitio. El sitio se identifica como <strong>{CLUB_DISPLAY_NAME}</strong>.
        </p>
      </section>

      <section>
        <h2>2. Naturaleza del servicio</h2>
        <p>El sitio es una plataforma web informativa y de gestión que permite, entre otras cosas:</p>
        <ul>
          <li>Consultar plantilla, partidos, resultados y avisos publicados.</li>
          <li>Ver estadísticas básicas (goles, asistencias, tarjetas) según lo registrado en resultados publicados.</li>
          <li>Validar credenciales digitales de jugadores.</li>
          <li>Gestionar contenidos mediante cuentas autorizadas.</li>
        </ul>
        <p>
          <strong>No es</strong> un servicio médico, de scouting profesional ni de análisis avanzado. Las
          cifras dependen de lo que se registre y publique en el panel.
        </p>
      </section>

      <section>
        <h2>3. Cuentas y acceso</h2>
        <p>
          Las cuentas del panel están reservadas a personas autorizadas por quien administra el sitio. Cada
          usuario debe proteger sus credenciales y cerrar sesión en equipos compartidos.
        </p>
      </section>

      <section>
        <h2>4. Contenido y propiedad</h2>
        <p>
          Textos, imágenes, logos y datos publicados en el sitio son responsabilidad de quien los carga con
          permiso. No está permitido copiar o republicar el contenido con fines comerciales ajenos sin
          autorización.
        </p>
        <p>
          El nombre y escudo mostrados identifican el proyecto {CLUB_DISPLAY_NAME}. El sitio no pretende
          representar oficialmente a FC Barcelona ni a otras entidades con marcas registradas, salvo acuerdo
          expreso por escrito.
        </p>
      </section>

      <section>
        <h2>5. Disponibilidad y cambios</h2>
        <p>
          El sitio se ofrece «tal cual». Pueden producirse interrupciones por mantenimiento o causas ajenas.
          No garantizamos disponibilidad ininterrumpida.
        </p>
      </section>

      <section>
        <h2>6. Limitación de responsabilidad</h2>
        <p>
          En la medida permitida por la ley, quien opera el sitio no será responsable por daños indirectos por
          el uso o imposibilidad de uso. Las decisiones deportivas, médicas o formativas no dependen solo de
          la información mostrada aquí.
        </p>
        <p>
          Quienes desarrollan o alojan la infraestructura técnica no asumen obligaciones directas frente a
          visitantes del sitio, salvo lo que corresponda por contrato con el responsable del contenido.
        </p>
      </section>

      <section>
        <h2>7. Enlaces externos</h2>
        <p>
          El sitio puede enlazar a terceros (mapas, WhatsApp, etc.). No controlamos esos sitios; revisa sus
          políticas por separado.
        </p>
      </section>

      <section>
        <h2>8. Contacto y ley aplicable</h2>
        <p>
          Consultas en{' '}
          <Link to="/contacto" className="text-primary hover:underline">
            contacto
          </Link>
          . Estos términos se interpretan conforme a las leyes de los Estados Unidos Mexicanos.
        </p>
      </section>
    </LegalPageShell>
  );
}
