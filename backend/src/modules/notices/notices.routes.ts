import { Router } from 'express';
import { authMiddleware } from '@middlewares/auth.middleware';
import { requireAdminOrCoach } from '@middlewares/role.middleware';
import { validateBody, validateParams, validateQuery } from '@middlewares/validate.middleware';
import { NoticesController } from './notices.controller';
import {
  listNoticesQuerySchema,
  noticeIdParamSchema,
  createNoticeBodySchema,
  updateNoticeBodySchema,
} from './notices.validation';

export const noticesRouter = Router();

noticesRouter.get(
  '/public',
  validateQuery(listNoticesQuerySchema),
  NoticesController.listPublic
);

noticesRouter.get(
  '/public/:id',
  validateParams(noticeIdParamSchema),
  NoticesController.getPublicById
);

noticesRouter.get(
  '/',
  authMiddleware,
  requireAdminOrCoach,
  validateQuery(listNoticesQuerySchema),
  NoticesController.listAdmin
);

noticesRouter.post(
  '/',
  authMiddleware,
  requireAdminOrCoach,
  validateBody(createNoticeBodySchema),
  NoticesController.create
);

noticesRouter.put(
  '/:id',
  authMiddleware,
  requireAdminOrCoach,
  validateParams(noticeIdParamSchema),
  validateBody(updateNoticeBodySchema),
  NoticesController.update
);

noticesRouter.patch(
  '/:id/publish',
  authMiddleware,
  requireAdminOrCoach,
  validateParams(noticeIdParamSchema),
  NoticesController.publish
);

noticesRouter.delete(
  '/:id',
  authMiddleware,
  requireAdminOrCoach,
  validateParams(noticeIdParamSchema),
  NoticesController.softDelete
);
