import { Request, Response, NextFunction } from 'express';
import { MatchesService } from './matches.service';
import { sendSuccess } from '@shared/utils/response';
import { routeParam } from '@shared/utils/route-params';
import { HTTP_STATUS } from '@config/constants';
import type {
  ListMatchesQuery,
  CreateMatchBody,
  UpdateMatchBody,
  ConvocatoryBody,
} from './matches.validation';

export class MatchesController {
  static async listPublic(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = req.validatedQuery as ListMatchesQuery;
      const result = await MatchesService.listPublic(q);
      sendSuccess(res, result.data, 'Partidos', HTTP_STATUS.OK, result.meta);
    } catch (e) {
      next(e);
    }
  }

  static async listUpcoming(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = req.validatedQuery as Pick<ListMatchesQuery, 'page' | 'limit' | 'category' | 'season'>;
      const result = await MatchesService.listUpcoming(q);
      sendSuccess(res, result.data, 'Próximos partidos', HTTP_STATUS.OK, result.meta);
    } catch (e) {
      next(e);
    }
  }

  static async getPublicById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const m = await MatchesService.getPublicById(routeParam(req, 'id'));
      sendSuccess(res, m, 'Partido');
    } catch (e) {
      next(e);
    }
  }

  static async listAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = req.validatedQuery as ListMatchesQuery;
      const result = await MatchesService.listAdmin(q);
      sendSuccess(res, result.data, 'Partidos', HTTP_STATUS.OK, result.meta);
    } catch (e) {
      next(e);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const m = await MatchesService.create(req.body as CreateMatchBody, req.user!.id);
      sendSuccess(res, m, 'Partido creado', HTTP_STATUS.CREATED);
    } catch (e) {
      next(e);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const m = await MatchesService.update(routeParam(req, 'id'), req.body as UpdateMatchBody);
      sendSuccess(res, m, 'Partido actualizado');
    } catch (e) {
      next(e);
    }
  }

  static async addConvocatories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rows = await MatchesService.addConvocatories(routeParam(req, 'id'), req.body as ConvocatoryBody);
      sendSuccess(res, rows, 'Convocatorias registradas', HTTP_STATUS.CREATED);
    } catch (e) {
      next(e);
    }
  }

  static async softDelete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await MatchesService.softDelete(routeParam(req, 'id'));
      sendSuccess(res, null, 'Partido eliminado');
    } catch (e) {
      next(e);
    }
  }
}
