import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { parseCorsOrigins } from '@config/cors-origins';
import { env, isProd } from '@config/env';
import { logger } from '@shared/utils/logger';
import { errorMiddleware } from '@middlewares/error.middleware';
import { requestContextMiddleware } from '@middlewares/request-context.middleware';
import {
  rejectOversizedJsonKeys,
  securityHeadersMiddleware,
} from '@middlewares/security.middleware';

// Rutas de módulos
import { authRouter }         from '@modules/auth/auth.routes';
import { usersRouter }        from '@modules/users/users.routes';
import { parentsRouter }      from '@modules/parents/parents.routes';
import { playersRouter }      from '@modules/players/players.routes';
import { qrRouter }           from '@modules/qr-validation/qr.routes';
import { matchesRouter }      from '@modules/matches/matches.routes';
import { resultsRouter }      from '@modules/results/results.routes';
import { noticesRouter }      from '@modules/notices/notices.routes';
import { galleryRouter }      from '@modules/gallery/gallery.routes';
import { inscriptionsRouter } from '@modules/inscriptions/inscriptions.routes';
import { settingsRouter }     from '@modules/settings/settings.routes';
import { dashboardRouter }    from '@modules/dashboard/dashboard.routes';
import { pushRouter }         from '@modules/push/push.routes';

/** Rutas de solo lectura pública: no deben agotar la cuota global tan rápido. */
function isPublicReadRoute(path: string, method: string): boolean {
  if (method !== 'GET') return false;
  if (/\/qr\/player\/[^/]+\/image$/.test(path)) return true;
  return (
    path.includes('/public') ||
    path.endsWith('/health') ||
    path.includes('/qr/validate/') ||
    path.includes('/push/public/vapid-key')
  );
}

export function createApp(): Application {
  const app = express();

  // Render/proxies: sin esto, todas las visitas cuentan como una sola IP → 429 para todos.
  if (isProd) {
    app.set('trust proxy', 1);
  }

  app.use(requestContextMiddleware);
  app.use(securityHeadersMiddleware);

  // ── Seguridad ─────────────────────────────────────────────
  app.use(
    helmet({
      hsts: isProd ? { maxAge: 31_536_000, includeSubDomains: true, preload: true } : false,
      // Permite que el front (Pages) cargue imágenes QR desde este API en otro dominio.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.disable('x-powered-by');

  // ── CORS ──────────────────────────────────────────────────
  const corsOrigins = parseCorsOrigins();
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) {
          callback(null, true);
          return;
        }
        if (corsOrigins.includes(origin)) {
          callback(null, origin);
          return;
        }
        callback(new Error(`Origen no permitido por CORS: ${origin}`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  // ── Health (antes del rate limit: monitores tipo UptimeRobot no consumen cuota) ──
  app.get('/health', (_req, res) => {
    res.set('Cache-Control', 'no-store');
    res.status(200).json({
      success: true,
      status:  'ok',
      message: 'Academia Barcelona API',
      env:     env.NODE_ENV,
      version: '1.0.0',
    });
  });

  // ── Rate Limiting ─────────────────────────────────────────
  const limiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max:      env.RATE_LIMIT_MAX_REQUESTS,
    standardHeaders: true,
    legacyHeaders:   false,
    skip: (req) => isPublicReadRoute(req.path, req.method),
    message: {
      success: false,
      message: 'Demasiadas peticiones. Intenta de nuevo más tarde.',
    },
  });
  const writeLimiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max:      Math.max(80, Math.floor(env.RATE_LIMIT_MAX_REQUESTS / 4)),
    standardHeaders: true,
    legacyHeaders:   false,
    skip: (req) => req.method === 'GET' || isPublicReadRoute(req.path, req.method),
    message: {
      success: false,
      message: 'Demasiadas peticiones. Intenta de nuevo más tarde.',
    },
  });
  app.use(limiter);
  app.use(writeLimiter);

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max:      30,
    standardHeaders: true,
    legacyHeaders:   false,
    message: {
      success: false,
      message: 'Demasiados intentos de acceso. Espera unos minutos.',
    },
  });

  // ── Body parsing ──────────────────────────────────────────
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: false, limit: '2mb' }));
  app.use(rejectOversizedJsonKeys());
  app.use(compression());

  // ── Logging HTTP ─────────────────────────────────────────
  if (!isProd) {
    app.use(morgan('dev'));
  } else {
    app.use(
      morgan('combined', {
        stream: { write: (msg) => logger.info(msg.trim()) },
      })
    );
  }

  // ── Rutas de la API ───────────────────────────────────────
  const prefix = env.API_PREFIX;

  app.use(`${prefix}/auth`, authLimiter, authRouter);
  app.use(`${prefix}/users`,        usersRouter);
  app.use(`${prefix}/parents`,      parentsRouter);
  app.use(`${prefix}/players`,      playersRouter);
  app.use(`${prefix}/qr`,           qrRouter);
  app.use(`${prefix}/matches`,      matchesRouter);
  app.use(`${prefix}/results`,      resultsRouter);
  app.use(`${prefix}/notices`,      noticesRouter);
  app.use(`${prefix}/gallery`,      galleryRouter);
  app.use(`${prefix}/inscriptions`, inscriptionsRouter);
  app.use(`${prefix}/settings`,     settingsRouter);
  app.use(`${prefix}/dashboard`,    dashboardRouter);
  app.use(`${prefix}/push`,         pushRouter);

  // ── Manejador de rutas no encontradas ────────────────────
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      message: 'Ruta no encontrada',
    });
  });

  // ── Manejador global de errores ───────────────────────────
  app.use(errorMiddleware);

  return app;
}
