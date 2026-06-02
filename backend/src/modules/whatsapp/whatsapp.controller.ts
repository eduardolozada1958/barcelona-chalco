import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '@shared/utils/response';
import { routeParam } from '@shared/utils/route-params';
import { formatPhoneForDisplay } from './phone';
import { getWhatsAppRecipientDiagnostics, listVerifiedParentWhatsAppRecipients } from './whatsapp.recipients';
import { WhatsAppService } from './whatsapp.service';

export class WhatsAppController {
  static async status(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.set('Pragma', 'no-cache');
      const status = WhatsAppService.getStatus();
      const recipients = await listVerifiedParentWhatsAppRecipients();
      const diagnostics = await getWhatsAppRecipientDiagnostics();
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
      sendSuccess(res, { ...status, qrDataUrl, eligibleRecipients: eligible, testRecipient, diagnostics });
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

  static async listDeliveryBatches(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? '15'), 10) || 15));
      const { data, meta } = await WhatsAppService.listDeliveryBatches({ page, limit });
      sendSuccess(res, data, 'Historial de envíos', 200, meta);
    } catch (e) {
      next(e);
    }
  }

  static async getDeliveryBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = routeParam(req, 'id');
      const detail = await WhatsAppService.getDeliveryBatchDetail(id);
      if (!detail) {
        res.status(404).json({ success: false, message: 'Envío no encontrado' });
        return;
      }
      sendSuccess(res, detail);
    } catch (e) {
      next(e);
    }
  }
}
