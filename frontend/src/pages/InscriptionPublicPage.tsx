import { Link } from 'react-router-dom';

import { MaterialIcon } from '@/components/MaterialIcon';

/** Formato internacional para tel: y wa.me (México, móvil). */
const COACH_PHONE_DISPLAY = '+52 1 56 3233 2292';
const COACH_PHONE_TEL = '+5215632332292';
const COACH_WHATSAPP_HREF = 'https://wa.me/5215632332292';

/**
 * Página pública de contacto: teléfono del entrenador para más información.
 * (Ruta `/contacto`; `/inscripcion` redirige aquí.)
 */
export function InscriptionPublicPage() {
  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col items-center px-margin-mobile md:px-margin-desktop py-stack-lg relative overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none flex justify-center items-start opacity-15">
        <div className="w-[600px] h-[600px] bg-primary rounded-full blur-[120px] mt-[-200px]" />
      </div>

      <main className="z-10 w-full max-w-lg text-center">
        <header className="mb-stack-lg">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary/40 bg-surface-container">
            <MaterialIcon name="call" className="text-primary" size={32} />
          </div>
          <h1 className="font-display-hero text-headline-lg-mobile md:text-display-hero text-primary tracking-tighter">
            Contacto
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-3">
            Para más información sobre la academia, horarios o inscripciones, comunícate con el entrenador <strong className="text-on-surface">Gabo</strong>.
          </p>
        </header>

        <div className="bg-[#002366]/30 backdrop-blur-md rounded-xl border border-primary/25 p-stack-lg relative overflow shadow-lg">
          <div className="absolute -top-16 -right-16 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-6">
            <div>
              <p className="font-label-caps text-label-caps text-on-surface-variant mb-2">Teléfono</p>
              <a
                href={`tel:${COACH_PHONE_TEL}`}
                className="inline-block font-display-hero text-2xl sm:text-3xl text-primary tracking-tight hover:underline break-all"
              >
                {COACH_PHONE_DISPLAY}
              </a>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={`tel:${COACH_PHONE_TEL}`}
                className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-primary bg-primary/10 px-5 py-3 font-label-caps text-label-caps text-primary hover:bg-primary/20 transition-colors"
              >
                <MaterialIcon name="call" size={18} />
                Llamar
              </a>
              <a
                href={COACH_WHATSAPP_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-outline-variant/40 bg-surface-container/80 px-5 py-3 font-label-caps text-label-caps text-on-surface hover:border-primary/40 transition-colors"
              >
                <MaterialIcon name="chat" size={18} />
                WhatsApp
              </a>
            </div>

            <p className="text-xs text-on-surface-variant/80 leading-relaxed">
              Si no te abre la llamada, copia el número y pégalo en tu teléfono o en WhatsApp.
            </p>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-on-surface-variant">
          <Link to="/" className="text-primary hover:underline">
            ← Volver al inicio
          </Link>
        </p>
      </main>
    </div>
  );
}
