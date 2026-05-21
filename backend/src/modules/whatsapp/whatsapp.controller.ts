import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '@shared/utils/response';
import { formatPhoneForDisplay } from './phone';
import { listVerifiedParentWhatsAppRecipients } from './whatsapp.recipients';
import { WhatsAppService } from './whatsapp.service';

export class WhatsAppController {
  static async status(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.set('Pragma', 'no-cache');
      const status = WhatsAppService.getStatus();
      const recipients = await listVerifiedParentWhatsAppRecipients();
      const eligible = recipients.length;
      const qrDataUrl = status.qr ? await WhatsAppService.getQrDataUrl() : null;
      const first = recipients[0];
      const testRecipient = first
        ? {
            name: first.label,
            phone: formatPhoneForDisplay(first.phoneRaw),
            phoneSource: first.phoneSource,
          }
        : null;
      sendSuccess(res, { ...status, qrDataUrl, eligibleRecipients: eligible, testRecipient });
    } catch (e) {
      next(e);
    }
  }

  static async reconnect(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await WhatsAppService.reconnect();
      sendSuccess(res, WhatsAppService.getStatus(), 'Sesión reiniciada. Escanea el QR si aparece.');
    } catch (e) {
      next(e);
    }
  }

  static async resetSession(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await WhatsAppService.resetSession();
      sendSuccess(res, WhatsAppService.getStatus(), 'Sesión reiniciada. Escanea el QR si aparece.');
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
