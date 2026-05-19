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
  adminRequestEmailChangeSchema,
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

usersRouter.post(
  '/:id/request-email-change',
  authMiddleware,
  requireAdmin,
  validateParams(userIdParamSchema),
  validateBody(adminRequestEmailChangeSchema),
  UsersController.requestEmailChange,
);

usersRouter.post(
  '/:id/unlock-login',
  authMiddleware,
  requireAdmin,
  validateParams(userIdParamSchema),
  UsersController.unlockLogin
);

usersRouter.delete(
  '/:id',
  authMiddleware,
  requireAdmin,
  validateParams(userIdParamSchema),
  UsersController.softDelete
);
