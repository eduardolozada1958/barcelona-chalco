import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '@config/database';
import { FeesService } from './fees.service';
import { sendSuccess } from '@shared/utils/response';
import { routeParam } from '@shared/utils/route-params';
import type { UpdatePlayerFeesBody } from './fees.validation';

export class FeesController {
  static async listMatrix(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const period = typeof req.query.period === 'string' ? req.query.period : undefined;
      const data = await FeesService.listMatrix(period);
      sendSuccess(res, data, 'Cuotas del mes');
    } catch (e) {
      next(e);
    }
  }

  static async updatePlayer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await FeesService.updatePlayerFees(
        routeParam(req, 'playerId'),
        req.body as UpdatePlayerFeesBody,
        req.user!.id,
      );
      sendSuccess(res, data, 'Cuotas actualizadas');
    } catch (e) {
      next(e);
    }
  }

  static async syncAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { data: parents, error } = await supabaseAdmin
        .from('parents')
        .select('id')
        .is('deleted_at', null);
      if (error) throw new Error(error.message);
      for (const p of parents ?? []) {
        await FeesService.syncParentPaymentHold(String((p as { id: string }).id));
      }
      const data = await FeesService.listMatrix();
      sendSuccess(res, data, 'Bloqueos por mora recalculados');
    } catch (e) {
      next(e);
    }
  }
}
