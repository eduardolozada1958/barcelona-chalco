import { Router } from 'express';
import { authMiddleware } from '@middlewares/auth.middleware';
import { requireAdmin } from '@middlewares/role.middleware';
import { WhatsAppController } from './whatsapp.controller';

export const whatsappRouter = Router();

whatsappRouter.get('/status', authMiddleware, requireAdmin, WhatsAppController.status);
whatsappRouter.post('/reconnect', authMiddleware, requireAdmin, WhatsAppController.reconnect);
whatsappRouter.post('/test', authMiddleware, requireAdmin, WhatsAppController.testSend);
