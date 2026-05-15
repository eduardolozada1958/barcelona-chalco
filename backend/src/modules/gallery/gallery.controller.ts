import { Request, Response, NextFunction } from 'express';
import { GalleryService } from './gallery.service';
import { sendSuccess } from '@shared/utils/response';
import { routeParam } from '@shared/utils/route-params';
import { HTTP_STATUS } from '@config/constants';
import { ValidationError } from '@middlewares/error.middleware';
import { createGalleryUploadFieldsSchema } from './gallery.validation';
import { assertGalleryImageFiles } from './gallery.media.middleware';
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

  static async createWithMedia(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const files = (req.files as Express.Multer.File[] | undefined) ?? [];
      assertGalleryImageFiles(files);

      const parsed = createGalleryUploadFieldsSchema.safeParse(req.body);
      if (!parsed.success) {
        const fieldErrors = parsed.error.flatten().fieldErrors;
        const errors = Object.entries(fieldErrors).flatMap(([field, msgs]) =>
          (msgs ?? []).map((message) => ({ field, message }))
        );
        return next(new ValidationError('Datos inválidos', errors));
      }

      const row = await GalleryService.createWithUpload(parsed.data, files, req.user!.id);
      sendSuccess(res, row, parsed.data.publish ? 'Publicación publicada' : 'Publicación creada', HTTP_STATUS.CREATED);
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
