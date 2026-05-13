import { Request, Response, NextFunction } from 'express';
import { PlayersService } from './players.service';
import { sendSuccess } from '@shared/utils/response';
import { routeParam } from '@shared/utils/route-params';
import { HTTP_STATUS } from '@config/constants';
import type { CreatePlayerInput, UpdatePlayerInput, ListPlayersQuery } from './players.validation';

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
      sendSuccess(res, result.data, 'Jugadores obtenidos', HTTP_STATUS.OK, result.meta);
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
      sendSuccess(res, player, 'Jugador obtenido');
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
      sendSuccess(res, player, 'Jugador creado exitosamente', HTTP_STATUS.CREATED);
    } catch (e) { next(e); }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const player = await PlayersService.update(routeParam(req, 'id'), req.body as UpdatePlayerInput);
      sendSuccess(res, player, 'Jugador actualizado exitosamente');
    } catch (e) { next(e); }
  }

  static async verify(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const player = await PlayersService.verify(routeParam(req, 'id'), req.user!.id);
      sendSuccess(res, player, 'Jugador verificado exitosamente');
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
