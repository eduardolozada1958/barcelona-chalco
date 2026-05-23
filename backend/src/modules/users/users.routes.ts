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
  adminSensitiveEmailChangeSchema,
  deleteUserBodySchema,
  remindUnlinkedParentsBodySchema,
} from './users.validation';

export const usersRouter = Router();

usersRouter.get(
  '/',
  authMiddleware,
  requireAdmin,
  validateQuery(listUsersQuerySchema),
  UsersController.list
);

usersRouter.get(
  '/unlinked-parents/stats',
  authMiddleware,
  requireAdmin,
  UsersController.unlinkedParentsStats,
);

usersRouter.post(
  '/unlinked-parents/remind',
  authMiddleware,
  requireAdmin,
  validateBody(remindUnlinkedParentsBodySchema),
  UsersController.remindUnlinkedParents,
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
  '/:id/send-delete-code',
  authMiddleware,
  requireAdmin,
  validateParams(userIdParamSchema),
  UsersController.sendDeleteVerificationCode,
);

usersRouter.post(
  '/:id/send-email-change-code',
  authMiddleware,
  requireAdmin,
  validateParams(userIdParamSchema),
  UsersController.sendEmailChangeVerificationCode,
);

usersRouter.post(
  '/:id/request-email-change',
  authMiddleware,
  requireAdmin,
  validateParams(userIdParamSchema),
  validateBody(adminSensitiveEmailChangeSchema),
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
  validateBody(deleteUserBodySchema),
  UsersController.softDelete
);
