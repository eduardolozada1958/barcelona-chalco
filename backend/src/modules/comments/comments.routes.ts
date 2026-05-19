import { Router } from 'express';
import { authMiddleware } from '@middlewares/auth.middleware';
import { requireAdminOrCoach } from '@middlewares/role.middleware';
import { validateBody, validateParams, validateQuery } from '@middlewares/validate.middleware';
import { CommentsController } from './comments.controller';
import {
  adminListCommentsQuerySchema,
  commentIdParamSchema,
  createCommentBodySchema,
  listCommentsQuerySchema,
  rejectCommentBodySchema,
} from './comments.validation';

export const commentsRouter = Router();

commentsRouter.get(
  '/public',
  validateQuery(listCommentsQuerySchema),
  CommentsController.listPublic,
);

commentsRouter.get(
  '/mine',
  authMiddleware,
  validateQuery(listCommentsQuerySchema),
  CommentsController.listMineForResource,
);

commentsRouter.get(
  '/admin',
  authMiddleware,
  requireAdminOrCoach,
  validateQuery(adminListCommentsQuerySchema),
  CommentsController.listAdmin,
);

commentsRouter.get(
  '/admin/pending-count',
  authMiddleware,
  requireAdminOrCoach,
  CommentsController.pendingCount,
);

commentsRouter.post(
  '/',
  authMiddleware,
  validateBody(createCommentBodySchema),
  CommentsController.create,
);

commentsRouter.post(
  '/:id/approve',
  authMiddleware,
  requireAdminOrCoach,
  validateParams(commentIdParamSchema),
  CommentsController.approve,
);

commentsRouter.post(
  '/:id/reject',
  authMiddleware,
  requireAdminOrCoach,
  validateParams(commentIdParamSchema),
  validateBody(rejectCommentBodySchema),
  CommentsController.reject,
);

commentsRouter.delete(
  '/:id',
  authMiddleware,
  validateParams(commentIdParamSchema),
  CommentsController.remove,
);
