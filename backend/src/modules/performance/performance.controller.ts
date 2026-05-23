import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '@shared/utils/response';
import { routeParam } from '@shared/utils/route-params';
import { HTTP_STATUS } from '@config/constants';
import { PerformanceService } from './performance.service';
import type {
  CreatePerformanceReportBody,
  ListPerformanceReportsQuery,
  UpdatePerformanceReportBody,
} from './performance.validation';

export class PerformanceController {
  static async listPublic(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = req.validatedQuery as ListPerformanceReportsQuery;
      const result = await PerformanceService.listPublic(q);
      sendSuccess(res, result.data, 'Informes obtenidos', HTTP_STATUS.OK, result.meta);
    } catch (e) {
      next(e);
    }
  }

  static async getPublicById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const report = await PerformanceService.getPublicById(routeParam(req, 'id'));
      sendSuccess(res, report, 'Informe obtenido');
    } catch (e) {
      next(e);
    }
  }

  static async listAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = req.validatedQuery as ListPerformanceReportsQuery;
      const result = await PerformanceService.listAdmin(q);
      sendSuccess(res, result.data, 'Informes obtenidos', HTTP_STATUS.OK, result.meta);
    } catch (e) {
      next(e);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const report = await PerformanceService.getById(routeParam(req, 'id'));
      sendSuccess(res, report, 'Informe obtenido');
    } catch (e) {
      next(e);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const report = await PerformanceService.create(req.body as CreatePerformanceReportBody, req.user!.id);
      sendSuccess(res, report, 'Informe creado', HTTP_STATUS.CREATED);
    } catch (e) {
      next(e);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const report = await PerformanceService.update(routeParam(req, 'id'), req.body as UpdatePerformanceReportBody);
      sendSuccess(res, report, 'Informe actualizado');
    } catch (e) {
      next(e);
    }
  }

  static async publish(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const publish = req.body?.publish !== false;
      const report = await PerformanceService.publish(routeParam(req, 'id'), publish);
      sendSuccess(res, report, publish ? 'Informe publicado' : 'Informe despublicado');
    } catch (e) {
      next(e);
    }
  }

  static async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await PerformanceService.softDelete(routeParam(req, 'id'));
      sendSuccess(res, null, 'Informe eliminado');
    } catch (e) {
      next(e);
    }
  }
}
