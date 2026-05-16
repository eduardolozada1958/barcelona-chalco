import { Request, Response, NextFunction } from 'express';
import { ResultsService } from './results.service';
import { sendSuccess } from '@shared/utils/response';
import { routeParam } from '@shared/utils/route-params';
import { HTTP_STATUS } from '@config/constants';
import type { ListResultsQuery, CreateResultBody, UpdateResultBody } from './results.validation';

export class ResultsController {
  static async listPublic(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = req.validatedQuery as ListResultsQuery;
      const result = await ResultsService.listPublic(q);
      sendSuccess(res, result.data, 'Resultados', HTTP_STATUS.OK, result.meta);
    } catch (e) {
      next(e);
    }
  }

  static async latestPublic(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const row = await ResultsService.latestPublic();
      sendSuccess(res, row, 'Último resultado');
    } catch (e) {
      next(e);
    }
  }

  static async listAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = req.validatedQuery as ListResultsQuery;
      const result = await ResultsService.listAdmin(q);
      sendSuccess(res, result.data, 'Resultados', HTTP_STATUS.OK, result.meta);
    } catch (e) {
      next(e);
    }
  }

  static async getByIdAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const row = await ResultsService.getById(routeParam(req, 'id'));
      sendSuccess(res, row, 'Resultado');
    } catch (e) {
      next(e);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const row = await ResultsService.create(req.body as CreateResultBody, req.user!.id);
      sendSuccess(res, row, 'Resultado creado', HTTP_STATUS.CREATED);
    } catch (e) {
      next(e);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const row = await ResultsService.update(routeParam(req, 'id'), req.body as UpdateResultBody);
      sendSuccess(res, row, 'Resultado actualizado');
    } catch (e) {
      next(e);
    }
  }

  static async publish(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const row = await ResultsService.publish(routeParam(req, 'id'));
      sendSuccess(res, row, 'Resultado publicado');
    } catch (e) {
      next(e);
    }
  }

  static async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await ResultsService.remove(routeParam(req, 'id'));
      sendSuccess(res, null, 'Resultado eliminado');
    } catch (e) {
      next(e);
    }
  }
}
