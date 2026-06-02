import rateLimit from 'express-rate-limit';

/** Solicitudes de vínculo padre–jugador por CURP (anti-enumeración). */
export const linkRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      15,
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success: false,
    message: 'Demasiadas solicitudes de vínculo. Intenta más tarde.',
  },
});

/** Creación de comentarios por usuario autenticado. */
export const commentsWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      40,
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success: false,
    message: 'Demasiados comentarios en poco tiempo. Espera un momento.',
  },
});

/** Lecturas públicas (anti-scraping sin bloquear navegación normal). */
export const publicReadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      300,
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success: false,
    message: 'Demasiadas peticiones públicas. Intenta de nuevo en unos minutos.',
  },
});

/** Inscripciones públicas (anti-spam). */
export const publicInscriptionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max:      10,
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success: false,
    message: 'Demasiadas inscripciones desde esta red. Intenta más tarde.',
  },
});

/** Health check (anti-DoS sin bloquear monitores legítimos). */
export const healthCheckLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:      120,
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success: false,
    message: 'Demasiadas peticiones al servidor.',
  },
});

/** Suscripción push pública (anti-spam en push_subscriptions). */
export const pushPublicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      25,
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success: false,
    message: 'Demasiadas suscripciones push. Intenta más tarde.',
  },
});

/** Operaciones sensibles de admin (WhatsApp, etc.). */
export const adminSensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      60,
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success: false,
    message: 'Demasiadas operaciones administrativas. Espera un momento.',
  },
});
