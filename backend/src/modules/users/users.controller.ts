import { Request, Response, NextFunction } from 'express';
import { UsersService } from './users.service';
import { sendSuccess } from '@shared/utils/response';
import { routeParam } from '@shared/utils/route-params';
import { HTTP_STATUS } from '@config/constants';
import type { UpdateUserBody } from './users.validation';
import type { ListUsersQuery } from './users.validation';

export class UsersController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = req.validatedQuery as ListUsersQuery;
      const result = await UsersService.list(q);
      sendSuccess(res, result.data, 'Usuarios obtenidos', HTTP_STATUS.OK, result.meta);
    } catch (e) {
      next(e);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await UsersService.getById(routeParam(req, 'id'));
      sendSuccess(res, user, 'Usuario obtenido');
    } catch (e) {
      next(e);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await UsersService.update(
        routeParam(req, 'id'),
        req.body as UpdateUserBody,
        req.user!.id
      );
      sendSuccess(res, user, 'Usuario actualizado');
    } catch (e) {
      next(e);
    }
  }

  static async softDelete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await UsersService.softDelete(routeParam(req, 'id'), req.user!.id);
      sendSuccess(res, null, 'Usuario eliminado');
    } catch (e) {
      next(e);
    }
  }
}
