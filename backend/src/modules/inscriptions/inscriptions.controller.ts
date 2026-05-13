import { Request, Response, NextFunction } from 'express';
import { InscriptionsService } from './inscriptions.service';
import { sendSuccess } from '@shared/utils/response';
import { routeParam } from '@shared/utils/route-params';
import { HTTP_STATUS } from '@config/constants';
import type {
  ListInscriptionsQuery,
  PublicInscriptionBody,
  ApproveInscriptionBody,
  RejectInscriptionBody,
} from './inscriptions.validation';

export class InscriptionsController {
  static async createPublic(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ip = req.ip ?? req.socket.remoteAddress ?? null;
      const row = await InscriptionsService.createPublic(req.body as PublicInscriptionBody, ip);
      sendSuccess(res, row, 'Solicitud registrada', HTTP_STATUS.CREATED);
    } catch (e) {
      next(e);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = req.validatedQuery as ListInscriptionsQuery;
      const result = await InscriptionsService.list(q);
      sendSuccess(res, result.data, 'Inscripciones', HTTP_STATUS.OK, result.meta);
    } catch (e) {
      next(e);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const row = await InscriptionsService.getById(routeParam(req, 'id'));
      sendSuccess(res, row, 'Inscripción');
    } catch (e) {
      next(e);
    }
  }

  static async approve(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const row = await InscriptionsService.approve(
        routeParam(req, 'id'),
        req.user!.id,
        req.body as ApproveInscriptionBody
      );
      sendSuccess(res, row, 'Inscripción aprobada');
    } catch (e) {
      next(e);
    }
  }

  static async reject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const row = await InscriptionsService.reject(
        routeParam(req, 'id'),
        req.user!.id,
        req.body as RejectInscriptionBody
      );
      sendSuccess(res, row, 'Inscripción rechazada');
    } catch (e) {
      next(e);
    }
  }

  static async convert(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const out = await InscriptionsService.convert(routeParam(req, 'id'), req.user!.id);
      sendSuccess(res, out, 'Jugador creado desde inscripción', HTTP_STATUS.CREATED);
    } catch (e) {
      next(e);
    }
  }
}
