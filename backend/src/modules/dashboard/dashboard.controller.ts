import { Request, Response, NextFunction } from 'express';
import { DashboardService } from './dashboard.service';
import { sendSuccess } from '@shared/utils/response';

export class DashboardController {
  static async stats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await DashboardService.getCoachStats();
      sendSuccess(res, stats, 'Estadísticas del panel');
    } catch (e) {
      next(e);
    }
  }
}
