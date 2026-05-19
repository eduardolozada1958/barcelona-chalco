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
