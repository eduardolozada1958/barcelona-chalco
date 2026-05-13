import { Router } from 'express';
import { authMiddleware } from '@middlewares/auth.middleware';
import { requireAdminOrCoach, requireParent } from '@middlewares/role.middleware';
import { validateBody, validateParams, validateQuery } from '@middlewares/validate.middleware';
import { ParentsController } from './parents.controller';
import {
  listParentsQuerySchema,
  parentIdParamSchema,
  updateParentBodySchema,
} from './parents.validation';

export const parentsRouter = Router();

parentsRouter.get(
  '/my-players',
  authMiddleware,
  requireParent,
  ParentsController.myPlayers
);

parentsRouter.get(
  '/',
  authMiddleware,
  requireAdminOrCoach,
  validateQuery(listParentsQuerySchema),
  ParentsController.list
);

parentsRouter.get(
  '/:id',
  authMiddleware,
  requireAdminOrCoach,
  validateParams(parentIdParamSchema),
  ParentsController.getById
);

parentsRouter.patch(
  '/:id',
  authMiddleware,
  requireAdminOrCoach,
  validateParams(parentIdParamSchema),
  validateBody(updateParentBodySchema),
  ParentsController.update
);
