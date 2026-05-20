import { Router } from 'express';
import { authMiddleware } from '@middlewares/auth.middleware';
import { requireAdminOrCoach } from '@middlewares/role.middleware';
import { validateBody, validateParams, validateQuery } from '@middlewares/validate.middleware';
import { FeesController } from './fees.controller';
import {
  feesPeriodQuerySchema,
  updatePlayerFeesBodySchema,
  playerIdParamSchema,
} from './fees.validation';

export const feesRouter = Router();

feesRouter.use(authMiddleware, requireAdminOrCoach);

feesRouter.get('/', validateQuery(feesPeriodQuerySchema), FeesController.listMatrix);
feesRouter.post('/sync-holds', FeesController.syncAll);
feesRouter.patch(
  '/players/:playerId',
  validateParams(playerIdParamSchema),
  validateBody(updatePlayerFeesBodySchema),
  FeesController.updatePlayer,
);
