import { Router } from 'express';
import { validateParams, validateQuery } from '@middlewares/validate.middleware';
import { QrController } from './qr.controller';
import {
  qrPlayerIdParamSchema,
  qrPlayerImageQuerySchema,
  qrTokenParamSchema,
} from './qr.validation';

export const qrRouter = Router();

qrRouter.get(
  '/validate/:token',
  validateParams(qrTokenParamSchema),
  QrController.validate,
);

qrRouter.get(
  '/player/:id/image',
  validateParams(qrPlayerIdParamSchema),
  validateQuery(qrPlayerImageQuerySchema),
  QrController.getImage,
);
