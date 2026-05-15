import { Router } from 'express';
import { PlayersController } from './players.controller';
import { authMiddleware } from '@middlewares/auth.middleware';
import { requireAdmin, requireAdminOrCoach } from '@middlewares/role.middleware';
import { validateBody, validateParams, validateQuery } from '@middlewares/validate.middleware';
import { runPlayerCreateUpload } from './players.upload.middleware';
import { runPlayerPhotoUpload } from './players.photo.middleware';
import { mergeCurpFromPdfIntoBody } from './players.curp-pdf.middleware';
import {
  createPlayerSchema,
  createPlayerMultipartFieldsSchema,
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

// GET /api/v1/players/:id/curp-document — URL firmada al PDF (solo admin; antes de /:id)
playersRouter.get('/:id/curp-document',
  authMiddleware,
  requireAdmin,
  validateParams(playerIdSchema),
  PlayersController.getCurpDocumentSigned
);

playersRouter.post('/:id/photo',
  authMiddleware,
  requireAdminOrCoach,
  validateParams(playerIdSchema),
  runPlayerPhotoUpload,
  PlayersController.uploadPhoto
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

// POST /api/v1/players/with-documents — Alta con PDF de CURP + foto (panel)
playersRouter.post('/with-documents',
  authMiddleware,
  requireAdminOrCoach,
  runPlayerCreateUpload,
  mergeCurpFromPdfIntoBody,
  validateBody(createPlayerMultipartFieldsSchema),
  PlayersController.createWithDocuments
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
