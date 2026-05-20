import { Request, Response, NextFunction } from 'express';
import { AttendanceService } from './attendance.service';
import { sendSuccess } from '@shared/utils/response';
import type { AttendanceUpsertBody } from './attendance.validation';

export class AttendanceController {
  static async getGrid(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const period = typeof req.query.period === 'string' ? req.query.period : undefined;
      const data = await AttendanceService.getGrid(period);
      sendSuccess(res, data, 'Asistencia del mes');
    } catch (e) {
      next(e);
    }
  }

  static async upsert(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await AttendanceService.upsertRecords(
        req.body as AttendanceUpsertBody,
        req.user!.id,
      );
      sendSuccess(res, data, 'Asistencia guardada');
    } catch (e) {
      next(e);
    }
  }
}
