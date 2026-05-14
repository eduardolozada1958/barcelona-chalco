import { Router } from 'express';
import { authMiddleware } from '@middlewares/auth.middleware';
import { requireAdminOrCoach } from '@middlewares/role.middleware';
import { DashboardController } from './dashboard.controller';

export const dashboardRouter = Router();

dashboardRouter.get(
  '/stats',
  authMiddleware,
  requireAdminOrCoach,
  DashboardController.stats
);
