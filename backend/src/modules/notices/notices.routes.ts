import { Router } from 'express';
import { authMiddleware } from '@middlewares/auth.middleware';
import { requireAdminOrCoach } from '@middlewares/role.middleware';
import { validateBody, validateParams, validateQuery } from '@middlewares/validate.middleware';
import { NoticesController } from './notices.controller';
import { runNoticeCoverUpload } from './notices.cover.middleware';
import {
  listNoticesQuerySchema,
  noticeIdParamSchema,
  createNoticeBodySchema,
  updateNoticeBodySchema,
  setNoticeArchivedBodySchema,
  scheduleNoticeBodySchema,
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

noticesRouter.patch(
  '/:id/archive',
  authMiddleware,
  requireAdminOrCoach,
  validateParams(noticeIdParamSchema),
  validateBody(setNoticeArchivedBodySchema),
  NoticesController.setArchived
);

noticesRouter.patch(
  '/:id/schedule',
  authMiddleware,
  requireAdminOrCoach,
  validateParams(noticeIdParamSchema),
  validateBody(scheduleNoticeBodySchema),
  NoticesController.schedulePublish
);

noticesRouter.post(
  '/:id/cover',
  authMiddleware,
  requireAdminOrCoach,
  validateParams(noticeIdParamSchema),
  runNoticeCoverUpload,
  NoticesController.uploadCover
);

noticesRouter.delete(
  '/:id',
  authMiddleware,
  requireAdminOrCoach,
  validateParams(noticeIdParamSchema),
  NoticesController.softDelete
);
