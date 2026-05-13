import { Router } from 'express';
import { authMiddleware } from '@middlewares/auth.middleware';
import { requireAdminOrCoach } from '@middlewares/role.middleware';
import { validateBody, validateParams, validateQuery } from '@middlewares/validate.middleware';
import { InscriptionsController } from './inscriptions.controller';
import {
  listInscriptionsQuerySchema,
  inscriptionIdParamSchema,
  publicInscriptionBodySchema,
  approveInscriptionBodySchema,
  rejectInscriptionBodySchema,
} from './inscriptions.validation';

export const inscriptionsRouter = Router();

inscriptionsRouter.post(
  '/public',
  validateBody(publicInscriptionBodySchema),
  InscriptionsController.createPublic
);

inscriptionsRouter.get(
  '/',
  authMiddleware,
  requireAdminOrCoach,
  validateQuery(listInscriptionsQuerySchema),
  InscriptionsController.list
);

inscriptionsRouter.get(
  '/:id',
  authMiddleware,
  requireAdminOrCoach,
  validateParams(inscriptionIdParamSchema),
  InscriptionsController.getById
);

inscriptionsRouter.patch(
  '/:id/approve',
  authMiddleware,
  requireAdminOrCoach,
  validateParams(inscriptionIdParamSchema),
  validateBody(approveInscriptionBodySchema),
  InscriptionsController.approve
);

inscriptionsRouter.patch(
  '/:id/reject',
  authMiddleware,
  requireAdminOrCoach,
  validateParams(inscriptionIdParamSchema),
  validateBody(rejectInscriptionBodySchema),
  InscriptionsController.reject
);

inscriptionsRouter.post(
  '/:id/convert',
  authMiddleware,
  requireAdminOrCoach,
  validateParams(inscriptionIdParamSchema),
  InscriptionsController.convert
);
