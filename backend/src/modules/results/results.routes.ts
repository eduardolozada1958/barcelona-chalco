import { Router } from 'express';
import { authMiddleware } from '@middlewares/auth.middleware';
import { requireAdminOrCoach } from '@middlewares/role.middleware';
import { validateBody, validateParams, validateQuery } from '@middlewares/validate.middleware';
import { ResultsController } from './results.controller';
import {
  listResultsQuerySchema,
  resultIdParamSchema,
  createResultBodySchema,
  updateResultBodySchema,
} from './results.validation';

export const resultsRouter = Router();

resultsRouter.get(
  '/public',
  validateQuery(listResultsQuerySchema),
  ResultsController.listPublic
);

resultsRouter.get('/public/latest', ResultsController.latestPublic);

resultsRouter.get(
  '/',
  authMiddleware,
  requireAdminOrCoach,
  validateQuery(listResultsQuerySchema),
  ResultsController.listAdmin
);

resultsRouter.get(
  '/:id',
  authMiddleware,
  requireAdminOrCoach,
  validateParams(resultIdParamSchema),
  ResultsController.getByIdAdmin
);

resultsRouter.post(
  '/',
  authMiddleware,
  requireAdminOrCoach,
  validateBody(createResultBodySchema),
  ResultsController.create
);

resultsRouter.put(
  '/:id',
  authMiddleware,
  requireAdminOrCoach,
  validateParams(resultIdParamSchema),
  validateBody(updateResultBodySchema),
  ResultsController.update
);

resultsRouter.patch(
  '/:id/publish',
  authMiddleware,
  requireAdminOrCoach,
  validateParams(resultIdParamSchema),
  ResultsController.publish
);

resultsRouter.delete(
  '/:id',
  authMiddleware,
  requireAdminOrCoach,
  validateParams(resultIdParamSchema),
  ResultsController.remove
);
