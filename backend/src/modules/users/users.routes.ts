import { Router } from 'express';
import { authMiddleware } from '@middlewares/auth.middleware';
import { requireAdmin } from '@middlewares/role.middleware';
import { validateBody, validateParams, validateQuery } from '@middlewares/validate.middleware';
import { UsersController } from './users.controller';
import {
  listUsersQuerySchema,
  userIdParamSchema,
  createUserBodySchema,
  updateUserBodySchema,
} from './users.validation';

export const usersRouter = Router();

usersRouter.get(
  '/',
  authMiddleware,
  requireAdmin,
  validateQuery(listUsersQuerySchema),
  UsersController.list
);

usersRouter.post(
  '/',
  authMiddleware,
  requireAdmin,
  validateBody(createUserBodySchema),
  UsersController.create
);

usersRouter.get(
  '/:id',
  authMiddleware,
  requireAdmin,
  validateParams(userIdParamSchema),
  UsersController.getById
);

usersRouter.patch(
  '/:id',
  authMiddleware,
  requireAdmin,
  validateParams(userIdParamSchema),
  validateBody(updateUserBodySchema),
  UsersController.update
);

usersRouter.delete(
  '/:id',
  authMiddleware,
  requireAdmin,
  validateParams(userIdParamSchema),
  UsersController.softDelete
);
