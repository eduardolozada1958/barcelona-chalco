import { Request, Response, NextFunction } from 'express';
import { ParentsService } from './parents.service';
import { sendSuccess } from '@shared/utils/response';
import { routeParam } from '@shared/utils/route-params';
import { HTTP_STATUS } from '@config/constants';
import type {
  CreateLinkRequestInput,
  ListLinkRequestsQuery,
  ListParentsQuery,
  RejectLinkRequestInput,
  UpdateParentBody,
} from './parents.validation';

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

  static async myLinkRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await ParentsService.getMyLinkRequests(req.user!.id);
      sendSuccess(res, data, 'Tus solicitudes de vínculo');
    } catch (e) {
      next(e);
    }
  }

  static async createLinkRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ParentsService.createLinkRequest(
        req.user!.id,
        req.body as CreateLinkRequestInput,
      );
      sendSuccess(
        res,
        result,
        'Solicitud enviada. El entrenador o administrador la revisará pronto.',
        HTTP_STATUS.CREATED,
      );
    } catch (e) {
      next(e);
    }
  }

  static async listLinkRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = req.validatedQuery as ListLinkRequestsQuery;
      const result = await ParentsService.listLinkRequests(q);
      sendSuccess(res, result.data, 'Solicitudes de vínculo', HTTP_STATUS.OK, result.meta);
    } catch (e) {
      next(e);
    }
  }

  static async approveLinkRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ParentsService.approveLinkRequest(
        routeParam(req, 'id'),
        req.user!.id,
      );
      sendSuccess(res, result, 'Vínculo aprobado. El padre ya verá al jugador en su cuenta.');
    } catch (e) {
      next(e);
    }
  }

  static async rejectLinkRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ParentsService.rejectLinkRequest(
        routeParam(req, 'id'),
        req.user!.id,
        req.body as RejectLinkRequestInput,
      );
      sendSuccess(res, result, 'Solicitud rechazada.');
    } catch (e) {
      next(e);
    }
  }
}
