import { Request, Response, NextFunction } from 'express';
import { PushService } from './push.service';
import { sendSuccess } from '@shared/utils/response';
import { HTTP_STATUS } from '@config/constants';
import type { SubscribePushBody, UnsubscribePushBody } from './push.validation';

export class PushController {
  static async getVapidPublicKey(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const publicKey = PushService.getPublicKey();
      sendSuccess(res, { publicKey }, 'Clave pública VAPID');
    } catch (e) {
      next(e);
    }
  }

  static async subscribe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body as SubscribePushBody;
      await PushService.subscribe(body, req.get('user-agent'));
      sendSuccess(res, null, 'Suscripción registrada', HTTP_STATUS.CREATED);
    } catch (e) {
      next(e);
    }
  }

  static async unsubscribe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { endpoint } = req.body as UnsubscribePushBody;
      await PushService.unsubscribe(endpoint);
      sendSuccess(res, null, 'Suscripción eliminada');
    } catch (e) {
      next(e);
    }
  }
}
