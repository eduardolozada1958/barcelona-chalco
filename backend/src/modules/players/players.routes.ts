import { Router } from 'express';
import { PlayersController } from './players.controller';
import { authMiddleware } from '@middlewares/auth.middleware';
import { requireAdminOrCoach } from '@middlewares/role.middleware';
import { validateBody, validateParams, validateQuery } from '@middlewares/validate.middleware';
import {
  createPlayerSchema,
  updatePlayerSchema,
  playerIdSchema,
  listPlayersQuerySchema,
} from './players.validation';

export const playersRouter = Router();

// ── Rutas públicas ────────────────────────────────────────────

// GET /api/v1/players/public - Listado público (solo verificados y activos)
playersRouter.get('/public',
  validateQuery(listPlayersQuerySchema),
  PlayersController.listPublic
);

// GET /api/v1/players/public/:id - Perfil público de un jugador
playersRouter.get('/public/:id',
  validateParams(playerIdSchema),
  PlayersController.getPublicProfile
);

// ── Rutas protegidas (Admin / Coach) ──────────────────────────

// GET /api/v1/players - Listado completo para admin/coach
playersRouter.get('/',
  authMiddleware,
  requireAdminOrCoach,
  validateQuery(listPlayersQuerySchema),
  PlayersController.list
);

// GET /api/v1/players/:id - Perfil completo (admin view)
playersRouter.get('/:id',
  authMiddleware,
  requireAdminOrCoach,
  validateParams(playerIdSchema),
  PlayersController.getById
);

// POST /api/v1/players - Crear jugador
playersRouter.post('/',
  authMiddleware,
  requireAdminOrCoach,
  validateBody(createPlayerSchema),
  PlayersController.create
);

// PUT /api/v1/players/:id - Actualizar jugador
playersRouter.put('/:id',
  authMiddleware,
  requireAdminOrCoach,
  validateParams(playerIdSchema),
  validateBody(updatePlayerSchema),
  PlayersController.update
);

// PATCH /api/v1/players/:id/verify - Verificar jugador
playersRouter.patch('/:id/verify',
  authMiddleware,
  requireAdminOrCoach,
  validateParams(playerIdSchema),
  PlayersController.verify
);

// PATCH /api/v1/players/:id/generate-qr - Generar token QR
playersRouter.patch('/:id/generate-qr',
  authMiddleware,
  requireAdminOrCoach,
  validateParams(playerIdSchema),
  PlayersController.generateQr
);

// DELETE /api/v1/players/:id - Soft delete
playersRouter.delete('/:id',
  authMiddleware,
  requireAdminOrCoach,
  validateParams(playerIdSchema),
  PlayersController.softDelete
);
