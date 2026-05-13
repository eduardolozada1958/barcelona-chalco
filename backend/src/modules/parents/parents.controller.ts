import { Request, Response, NextFunction } from 'express';
import { ParentsService } from './parents.service';
import { sendSuccess } from '@shared/utils/response';
import { routeParam } from '@shared/utils/route-params';
import { HTTP_STATUS } from '@config/constants';
import type { ListParentsQuery, UpdateParentBody } from './parents.validation';

export class ParentsController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = req.validatedQuery as ListParentsQuery;
      const result = await ParentsService.list(q);
      sendSuccess(res, result.data, 'Padres obtenidos', HTTP_STATUS.OK, result.meta);
    } catch (e) {
      next(e);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parent = await ParentsService.getById(routeParam(req, 'id'));
      sendSuccess(res, parent, 'Padre/tutor obtenido');
    } catch (e) {
      next(e);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parent = await ParentsService.update(routeParam(req, 'id'), req.body as UpdateParentBody);
      sendSuccess(res, parent, 'Perfil actualizado');
    } catch (e) {
      next(e);
    }
  }

  static async myPlayers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await ParentsService.getMyPlayers(req.user!.id);
      sendSuccess(res, data, 'Jugadores vinculados');
    } catch (e) {
      next(e);
    }
  }
}
