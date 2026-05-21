import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '@shared/utils/response';
import { WhatsAppService } from './whatsapp.service';

export class WhatsAppController {
  static async status(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = WhatsAppService.getStatus();
      const eligible = await WhatsAppService.countEligibleRecipients();
      const qrDataUrl = status.qr ? await WhatsAppService.getQrDataUrl() : null;
      sendSuccess(res, { ...status, qrDataUrl, eligibleRecipients: eligible });
    } catch (e) {
      next(e);
    }
  }

  static async reconnect(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await WhatsAppService.reconnect();
      sendSuccess(res, WhatsAppService.getStatus(), 'Reconectando WhatsApp…');
    } catch (e) {
      next(e);
    }
  }

  static async testSend(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await WhatsAppService.sendTestMessage();
      sendSuccess(res, result, 'Mensaje de prueba enviado al primer padre con WhatsApp activo');
    } catch (e) {
      next(e);
    }
  }
}
