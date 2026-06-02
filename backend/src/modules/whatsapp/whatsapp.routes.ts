import { Router } from 'express';
import { authMiddleware } from '@middlewares/auth.middleware';
import { requireAdmin } from '@middlewares/role.middleware';
import { adminSensitiveLimiter } from '@middlewares/rate-limit.middleware';
import { validateParams } from '@middlewares/validate.middleware';
import { WhatsAppController } from './whatsapp.controller';
import { whatsappBatchIdParamSchema } from './whatsapp.validation';

export const whatsappRouter = Router();

const adminWa = [adminSensitiveLimiter, authMiddleware, requireAdmin] as const;

whatsappRouter.get('/status', ...adminWa, WhatsAppController.status);
whatsappRouter.post('/reconnect', ...adminWa, WhatsAppController.reconnect);
whatsappRouter.post('/reset-session', ...adminWa, WhatsAppController.resetSession);
whatsappRouter.post('/test', ...adminWa, WhatsAppController.testSend);
whatsappRouter.get('/delivery-batches', ...adminWa, WhatsAppController.listDeliveryBatches);
whatsappRouter.get(
  '/delivery-batches/:id',
  ...adminWa,
  validateParams(whatsappBatchIdParamSchema),
  WhatsAppController.getDeliveryBatch,
);
