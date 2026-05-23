import { Router } from 'express';
import { authMiddleware } from '@middlewares/auth.middleware';
import { requireAdminOrCoach } from '@middlewares/role.middleware';
import { validateBody, validateParams, validateQuery } from '@middlewares/validate.middleware';
import { PerformanceController } from './performance.controller';
import {
  createPerformanceReportSchema,
  listPerformanceReportsQuerySchema,
  performanceReportIdParamSchema,
  updatePerformanceReportSchema,
} from './performance.validation';

export const performanceRouter = Router();

performanceRouter.get(
  '/public',
  validateQuery(listPerformanceReportsQuerySchema),
  PerformanceController.listPublic,
);

performanceRouter.get(
  '/public/:id',
  validateParams(performanceReportIdParamSchema),
  PerformanceController.getPublicById,
);

performanceRouter.get(
  '/',
  authMiddleware,
  requireAdminOrCoach,
  validateQuery(listPerformanceReportsQuerySchema),
  PerformanceController.listAdmin,
);

performanceRouter.get(
  '/:id',
  authMiddleware,
  requireAdminOrCoach,
  validateParams(performanceReportIdParamSchema),
  PerformanceController.getById,
);

performanceRouter.post(
  '/',
  authMiddleware,
  requireAdminOrCoach,
  validateBody(createPerformanceReportSchema),
  PerformanceController.create,
);

performanceRouter.put(
  '/:id',
  authMiddleware,
  requireAdminOrCoach,
  validateParams(performanceReportIdParamSchema),
  validateBody(updatePerformanceReportSchema),
  PerformanceController.update,
);

performanceRouter.patch(
  '/:id/publish',
  authMiddleware,
  requireAdminOrCoach,
  validateParams(performanceReportIdParamSchema),
  PerformanceController.publish,
);

performanceRouter.delete(
  '/:id',
  authMiddleware,
  requireAdminOrCoach,
  validateParams(performanceReportIdParamSchema),
  PerformanceController.remove,
);
