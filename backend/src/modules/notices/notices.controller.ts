import { Request, Response, NextFunction } from 'express';
import { NoticesService } from './notices.service';
import { sendSuccess } from '@shared/utils/response';
import { routeParam } from '@shared/utils/route-params';
import { HTTP_STATUS } from '@config/constants';
import type { ListNoticesQuery, CreateNoticeBody, UpdateNoticeBody } from './notices.validation';

export class NoticesController {
  static async listPublic(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = req.validatedQuery as ListNoticesQuery;
      const result = await NoticesService.listPublic(q);
      sendSuccess(res, result.data, 'Avisos', HTTP_STATUS.OK, result.meta);
    } catch (e) {
      next(e);
    }
  }

  static async getPublicById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const row = await NoticesService.getPublicById(routeParam(req, 'id'));
      sendSuccess(res, row, 'Aviso');
    } catch (e) {
      next(e);
    }
  }

  static async listAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = req.validatedQuery as ListNoticesQuery;
      const result = await NoticesService.listAdmin(q);
      sendSuccess(res, result.data, 'Avisos', HTTP_STATUS.OK, result.meta);
    } catch (e) {
      next(e);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const row = await NoticesService.create(req.body as CreateNoticeBody, req.user!.id);
      sendSuccess(res, row, 'Aviso creado', HTTP_STATUS.CREATED);
    } catch (e) {
      next(e);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const row = await NoticesService.update(routeParam(req, 'id'), req.body as UpdateNoticeBody);
      sendSuccess(res, row, 'Aviso actualizado');
    } catch (e) {
      next(e);
    }
  }

  static async publish(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const row = await NoticesService.publish(routeParam(req, 'id'));
      sendSuccess(res, row, 'Aviso publicado');
    } catch (e) {
      next(e);
    }
  }

  static async softDelete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await NoticesService.softDelete(routeParam(req, 'id'));
      sendSuccess(res, null, 'Aviso eliminado');
    } catch (e) {
      next(e);
    }
  }
}
