import { Router } from 'express';
import { authMiddleware } from '@middlewares/auth.middleware';
import { requireAdmin } from '@middlewares/role.middleware';
import { validateBody } from '@middlewares/validate.middleware';
import { SettingsController } from './settings.controller';
import { updateSettingsBodySchema } from './settings.validation';

export const settingsRouter = Router();

settingsRouter.get('/public', SettingsController.getPublic);

settingsRouter.get('/', authMiddleware, requireAdmin, SettingsController.getAdmin);

settingsRouter.put(
  '/',
  authMiddleware,
  requireAdmin,
  validateBody(updateSettingsBodySchema),
  SettingsController.update
);
