import { Request, Response, NextFunction } from 'express';
import { UsersService } from './users.service';
import { sendSuccess } from '@shared/utils/response';
import { routeParam } from '@shared/utils/route-params';
import { HTTP_STATUS } from '@config/constants';
import type {
  CreateUserBody,
  UpdateUserBody,
  ListUsersQuery,
  DeleteUserBody,
  AdminSensitiveEmailChangeBody,
} from './users.validation';

export class UsersController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = req.validatedQuery as ListUsersQuery;
      const result = await UsersService.list(q);
      sendSuccess(res, result.data, 'Usuarios obtenidos', HTTP_STATUS.OK, result.meta);
    } catch (e) {
      next(e);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await UsersService.getById(routeParam(req, 'id'));
      sendSuccess(res, user, 'Usuario obtenido');
    } catch (e) {
      next(e);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await UsersService.create(req.body as CreateUserBody);
      sendSuccess(res, user, 'Usuario creado', HTTP_STATUS.CREATED);
    } catch (e) {
      next(e);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await UsersService.update(
        routeParam(req, 'id'),
        req.body as UpdateUserBody,
        req.user!.id
      );
      sendSuccess(res, user, 'Usuario actualizado');
    } catch (e) {
      next(e);
    }
  }

  static async sendDeleteVerificationCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await UsersService.sendDeleteVerificationCode(
        routeParam(req, 'id'),
        req.user!.id,
        req.user!.email,
      );
      sendSuccess(res, null, 'Código enviado a tu correo de administrador');
    } catch (e) {
      next(e);
    }
  }

  static async sendEmailChangeVerificationCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await UsersService.sendEmailChangeVerificationCode(
        routeParam(req, 'id'),
        req.user!.id,
        req.user!.email,
      );
      sendSuccess(res, null, 'Código enviado a tu correo de administrador');
    } catch (e) {
      next(e);
    }
  }

  static async requestEmailChange(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { newEmail, verificationCode } = req.body as AdminSensitiveEmailChangeBody;
      const result = await UsersService.requestEmailChange(
        routeParam(req, 'id'),
        req.user!.id,
        req.user!.email,
        newEmail,
        verificationCode,
      );
      sendSuccess(
        res,
        result,
        `Se envió un enlace de confirmación a ${result.newEmail}. El usuario debe abrirlo para completar el cambio.`,
      );
    } catch (e) {
      next(e);
    }
  }

  static async unlockLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await UsersService.unlockLogin(routeParam(req, 'id'), req.user!.id);
      sendSuccess(res, user, 'Cuenta desbloqueada. El usuario ya puede iniciar sesión.');
    } catch (e) {
      next(e);
    }
  }

  static async softDelete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { verificationCode } = (req.body ?? {}) as DeleteUserBody;
      await UsersService.softDelete(
        routeParam(req, 'id'),
        req.user!.id,
        req.user!.email,
        verificationCode,
      );
      sendSuccess(res, null, 'Usuario eliminado');
    } catch (e) {
      next(e);
    }
  }
}
