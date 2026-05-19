import { Router } from 'express';
import { authMiddleware } from '@middlewares/auth.middleware';
import { requireAdminOrCoach, requireParent } from '@middlewares/role.middleware';
import { validateBody, validateParams, validateQuery } from '@middlewares/validate.middleware';
import { ParentsController } from './parents.controller';
import {
  createLinkRequestSchema,
  linkRequestIdParamSchema,
  listLinkRequestsQuerySchema,
  listParentsQuerySchema,
  parentIdParamSchema,
  rejectLinkRequestSchema,
  updateParentBodySchema,
} from './parents.validation';

export const parentsRouter = Router();

parentsRouter.get(
  '/my-players',
  authMiddleware,
  requireParent,
  ParentsController.myPlayers,
);

parentsRouter.get(
  '/link-requests/me',
  authMiddleware,
  requireParent,
  ParentsController.myLinkRequests,
);

parentsRouter.post(
  '/link-requests',
  authMiddleware,
  requireParent,
  validateBody(createLinkRequestSchema),
  ParentsController.createLinkRequest,
);

parentsRouter.get(
  '/link-requests',
  authMiddleware,
  requireAdminOrCoach,
  validateQuery(listLinkRequestsQuerySchema),
  ParentsController.listLinkRequests,
);

parentsRouter.post(
  '/link-requests/:id/approve',
  authMiddleware,
  requireAdminOrCoach,
  validateParams(linkRequestIdParamSchema),
  ParentsController.approveLinkRequest,
);

parentsRouter.post(
  '/link-requests/:id/reject',
  authMiddleware,
  requireAdminOrCoach,
  validateParams(linkRequestIdParamSchema),
  validateBody(rejectLinkRequestSchema),
  ParentsController.rejectLinkRequest,
);

parentsRouter.get(
  '/',
  authMiddleware,
  requireAdminOrCoach,
  validateQuery(listParentsQuerySchema),
  ParentsController.list,
);

parentsRouter.get(
  '/:id',
  authMiddleware,
  requireAdminOrCoach,
  validateParams(parentIdParamSchema),
  ParentsController.getById,
);

parentsRouter.patch(
  '/:id',
  authMiddleware,
  requireAdminOrCoach,
  validateParams(parentIdParamSchema),
  validateBody(updateParentBodySchema),
  ParentsController.update,
);
