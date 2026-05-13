import { Request, Response, NextFunction } from 'express';
import { SettingsService } from './settings.service';
import { sendSuccess } from '@shared/utils/response';
import type { UpdateSettingsBody } from './settings.validation';

export class SettingsController {
  static async getPublic(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await SettingsService.getPublic();
      sendSuccess(res, data, 'Configuración pública del club');
    } catch (e) {
      next(e);
    }
  }

  static async getAdmin(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await SettingsService.getActiveRow();
      sendSuccess(res, data, 'Configuración del club');
    } catch (e) {
      next(e);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await SettingsService.update(req.body as UpdateSettingsBody);
      sendSuccess(res, data, 'Configuración actualizada');
    } catch (e) {
      next(e);
    }
  }
}
