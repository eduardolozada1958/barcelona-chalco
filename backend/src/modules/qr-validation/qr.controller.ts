import { Request, Response, NextFunction } from 'express';
import { QrService } from './qr.service';
import { routeParam } from '@shared/utils/route-params';
import { HTTP_STATUS } from '@config/constants';

export class QrController {
  static async validate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token     = routeParam(req, 'token');
      const ip        = req.ip ?? req.socket.remoteAddress ?? null;
      const userAgent = req.headers['user-agent'] ?? null;

      const result = await QrService.validate(token, ip, userAgent);

      if (!result.isValid) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Credencial no válida o jugador no verificado',
          data:    { isValid: false },
        });
        return;
      }

      res.json({
        success: true,
        message: 'Credencial válida',
        data:    { isValid: true, player: result.player },
      });
    } catch (err) {
      next(err);
    }
  }

  static async getImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const qrBuffer = await QrService.generateImage(routeParam(req, 'id'));

      res.set('Content-Type', 'image/png');
      res.set('Cache-Control', 'public, max-age=86400, immutable');
      res.send(qrBuffer);
    } catch (err) {
      next(err);
    }
  }
}
