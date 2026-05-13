import { Request, Response, NextFunction } from 'express';
import { GalleryService } from './gallery.service';
import { sendSuccess } from '@shared/utils/response';
import { routeParam } from '@shared/utils/route-params';
import { HTTP_STATUS } from '@config/constants';
import type { ListGalleryQuery, CreateGalleryPostBody, UpdateGalleryPostBody } from './gallery.validation';

export class GalleryController {
  static async listPublic(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = req.validatedQuery as ListGalleryQuery;
      const result = await GalleryService.listPublic(q);
      sendSuccess(res, result.data, 'Galería', HTTP_STATUS.OK, result.meta);
    } catch (e) {
      next(e);
    }
  }

  static async getPublicById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const row = await GalleryService.getPublicById(routeParam(req, 'id'));
      sendSuccess(res, row, 'Publicación');
    } catch (e) {
      next(e);
    }
  }

  static async listAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = req.validatedQuery as ListGalleryQuery;
      const result = await GalleryService.listAdmin(q);
      sendSuccess(res, result.data, 'Galería', HTTP_STATUS.OK, result.meta);
    } catch (e) {
      next(e);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const row = await GalleryService.create(req.body as CreateGalleryPostBody, req.user!.id);
      sendSuccess(res, row, 'Publicación creada', HTTP_STATUS.CREATED);
    } catch (e) {
      next(e);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const row = await GalleryService.update(routeParam(req, 'id'), req.body as UpdateGalleryPostBody);
      sendSuccess(res, row, 'Publicación actualizada');
    } catch (e) {
      next(e);
    }
  }

  static async publish(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const row = await GalleryService.publish(routeParam(req, 'id'));
      sendSuccess(res, row, 'Publicación publicada');
    } catch (e) {
      next(e);
    }
  }

  static async softDelete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await GalleryService.softDelete(routeParam(req, 'id'));
      sendSuccess(res, null, 'Publicación eliminada');
    } catch (e) {
      next(e);
    }
  }
}
