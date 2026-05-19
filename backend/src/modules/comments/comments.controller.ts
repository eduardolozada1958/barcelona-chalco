import { Request, Response, NextFunction } from 'express';
import { CommentsService } from './comments.service';
import { sendSuccess } from '@shared/utils/response';
import { routeParam } from '@shared/utils/route-params';
import { HTTP_STATUS } from '@config/constants';
import type {
  AdminListCommentsQuery,
  CreateCommentBody,
  ListCommentsQuery,
  RejectCommentBody,
} from './comments.validation';

export class CommentsController {
  static async listPublic(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = req.validatedQuery as ListCommentsQuery;
      const result = await CommentsService.listPublic(q);
      sendSuccess(res, result.data, 'Comentarios', HTTP_STATUS.OK, result.meta);
    } catch (e) {
      next(e);
    }
  }

  static async listMineForResource(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = req.validatedQuery as ListCommentsQuery;
      const data = await CommentsService.listMineForResource(req.user!.id, q);
      sendSuccess(res, data, 'Tus comentarios');
    } catch (e) {
      next(e);
    }
  }

  static async listAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = req.validatedQuery as AdminListCommentsQuery;
      const result = await CommentsService.listAdmin(q);
      sendSuccess(res, result.data, 'Comentarios (admin)', HTTP_STATUS.OK, result.meta);
    } catch (e) {
      next(e);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await CommentsService.create(req.user!.id, req.body as CreateCommentBody);
      const message =
        result.status === 'approved'
          ? 'Comentario publicado.'
          : 'Comentario enviado, está pendiente de moderación.';
      sendSuccess(res, result, message, HTTP_STATUS.CREATED);
    } catch (e) {
      next(e);
    }
  }

  static async approve(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await CommentsService.approve(routeParam(req, 'id'), req.user!.id);
      sendSuccess(res, result, 'Comentario aprobado.');
    } catch (e) {
      next(e);
    }
  }

  static async reject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await CommentsService.reject(
        routeParam(req, 'id'),
        req.user!.id,
        req.body as RejectCommentBody,
      );
      sendSuccess(res, result, 'Comentario rechazado.');
    } catch (e) {
      next(e);
    }
  }

  static async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await CommentsService.remove(routeParam(req, 'id'), req.user!.id, req.user!.role);
      sendSuccess(res, null, 'Comentario eliminado.');
    } catch (e) {
      next(e);
    }
  }

  static async pendingCount(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const count = await CommentsService.pendingCount();
      sendSuccess(res, { count }, 'Comentarios pendientes');
    } catch (e) {
      next(e);
    }
  }
}
