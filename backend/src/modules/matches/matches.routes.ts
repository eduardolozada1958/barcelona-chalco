import { Router } from 'express';
import { authMiddleware } from '@middlewares/auth.middleware';
import { requireAdminOrCoach } from '@middlewares/role.middleware';
import { validateBody, validateParams, validateQuery } from '@middlewares/validate.middleware';
import { MatchesController } from './matches.controller';
import { runOpponentLogoUpload } from './matches.opponent-logo.middleware';
import {
  listMatchesQuerySchema,
  matchIdParamSchema,
  createMatchBodySchema,
  updateMatchBodySchema,
  convocatoryBodySchema,
} from './matches.validation';

export const matchesRouter = Router();

matchesRouter.get(
  '/public',
  validateQuery(listMatchesQuerySchema),
  MatchesController.listPublic
);

matchesRouter.get(
  '/public/upcoming',
  validateQuery(listMatchesQuerySchema.pick({ page: true, limit: true, category: true, season: true })),
  MatchesController.listUpcoming
);

matchesRouter.get(
  '/public/:id',
  validateParams(matchIdParamSchema),
  MatchesController.getPublicById
);

matchesRouter.get(
  '/',
  authMiddleware,
  requireAdminOrCoach,
  validateQuery(listMatchesQuerySchema),
  MatchesController.listAdmin
);

matchesRouter.post(
  '/',
  authMiddleware,
  requireAdminOrCoach,
  validateBody(createMatchBodySchema),
  MatchesController.create
);

matchesRouter.put(
  '/:id',
  authMiddleware,
  requireAdminOrCoach,
  validateParams(matchIdParamSchema),
  validateBody(updateMatchBodySchema),
  MatchesController.update
);

matchesRouter.post(
  '/:id/opponent-logo',
  authMiddleware,
  requireAdminOrCoach,
  validateParams(matchIdParamSchema),
  runOpponentLogoUpload,
  MatchesController.uploadOpponentLogo
);

matchesRouter.delete(
  '/:id',
  authMiddleware,
  requireAdminOrCoach,
  validateParams(matchIdParamSchema),
  MatchesController.softDelete
);

matchesRouter.post(
  '/:id/convocatories',
  authMiddleware,
  requireAdminOrCoach,
  validateParams(matchIdParamSchema),
  validateBody(convocatoryBodySchema),
  MatchesController.addConvocatories
);
