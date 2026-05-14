import { Request, Response, NextFunction } from 'express';
import { PlayersService } from './players.service';
import { sanitizePlayerRecordForApi } from './players.sanitize';
import { sendSuccess } from '@shared/utils/response';
import { routeParam } from '@shared/utils/route-params';
import { HTTP_STATUS } from '@config/constants';
import { ValidationError } from '@middlewares/error.middleware';
import { env } from '@config/env';
import type {
  CreatePlayerInput,
  CreatePlayerMultipartInput,
  UpdatePlayerInput,
  ListPlayersQuery,
} from './players.validation';

const PHOTO_MIMES = new Set(['image/png', 'image/jpeg', 'image/webp']);

function forViewer(row: unknown): Record<string, unknown> {
  return sanitizePlayerRecordForApi(row as Record<string, unknown>);
}

export class PlayersController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = req.validatedQuery as ListPlayersQuery;
      const result = await PlayersService.list({
        page:        q.page,
        limit:       q.limit,
        category:    q.category,
        status:      q.status,
        search:      q.search,
        season:      q.season,
        isVerified: q.isVerified,
      });
      const rows = (result.data ?? []).map((row) => forViewer(row));
      sendSuccess(res, rows, 'Jugadores obtenidos', HTTP_STATUS.OK, result.meta);
    } catch (e) { next(e); }
  }

  static async listPublic(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = req.validatedQuery as Pick<ListPlayersQuery, 'page' | 'limit' | 'category' | 'search'>;
      const result = await PlayersService.listPublic({
        page:     q.page,
        limit:    q.limit,
        category: q.category,
        search:   q.search,
      });
      sendSuccess(res, result.data, 'Jugadores obtenidos', HTTP_STATUS.OK, result.meta);
    } catch (e) { next(e); }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const player = await PlayersService.getById(routeParam(req, 'id'));
      sendSuccess(res, forViewer(player), 'Jugador obtenido');
    } catch (e) { next(e); }
  }

  static async getPublicProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const player = await PlayersService.getPublicProfile(routeParam(req, 'id'));
      sendSuccess(res, player, 'Perfil del jugador');
    } catch (e) { next(e); }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const player = await PlayersService.create(req.body as CreatePlayerInput);
      sendSuccess(res, forViewer(player), 'Jugador creado exitosamente', HTTP_STATUS.CREATED);
    } catch (e) { next(e); }
  }

  static async createWithDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const mf = req.files as Record<string, Express.Multer.File[]> | undefined;
      const curpPdf = mf?.curpPdf?.[0];
      const photo = mf?.photo?.[0];
      if (!curpPdf) {
        return next(new ValidationError('Adjunta el PDF oficial de la CURP', [{ field: 'curpPdf', message: 'Requerido' }]));
      }
      if (curpPdf.mimetype !== 'application/pdf') {
        return next(new ValidationError('El documento de CURP debe ser PDF', [{ field: 'curpPdf', message: 'Solo PDF' }]));
      }
      if (photo) {
        if (!PHOTO_MIMES.has(photo.mimetype)) {
          return next(new ValidationError('La foto debe ser PNG, JPEG o WebP', [{ field: 'photo', message: 'Formato no permitido' }]));
        }
        if (photo.size > env.STORAGE_MAX_FILE_SIZE) {
          return next(new ValidationError('La foto supera el tamaño máximo permitido', [{ field: 'photo', message: 'Muy grande' }]));
        }
      }

      const player = await PlayersService.createWithDocuments(
        req.body as CreatePlayerMultipartInput,
        { curpPdf, photo },
      );
      sendSuccess(
        res,
        forViewer(player),
        'Jugador creado con documentos',
        HTTP_STATUS.CREATED,
      );
    } catch (e) { next(e); }
  }

  static async getCurpDocumentSigned(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const url = await PlayersService.getSignedCurpDocumentUrl(routeParam(req, 'id'), req.user!.role);
      sendSuccess(res, { url }, 'Enlace temporal al PDF');
    } catch (e) { next(e); }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const player = await PlayersService.update(routeParam(req, 'id'), req.body as UpdatePlayerInput);
      sendSuccess(res, forViewer(player), 'Jugador actualizado exitosamente');
    } catch (e) { next(e); }
  }

  static async verify(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const player = await PlayersService.verify(routeParam(req, 'id'), req.user!.id);
      sendSuccess(res, forViewer(player), 'Jugador verificado exitosamente');
    } catch (e) { next(e); }
  }

  static async generateQr(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await PlayersService.generateQr(routeParam(req, 'id'));
      sendSuccess(res, result, 'Código QR generado exitosamente');
    } catch (e) { next(e); }
  }

  static async softDelete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await PlayersService.softDelete(routeParam(req, 'id'));
      sendSuccess(res, null, 'Jugador eliminado exitosamente');
    } catch (e) { next(e); }
  }
}
