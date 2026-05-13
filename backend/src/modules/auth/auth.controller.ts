import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { sendSuccess } from '@shared/utils/response';
import { HTTP_STATUS } from '@config/constants';
import type { LoginInput, RegisterParentInput, RefreshTokenInput } from './auth.validation';

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as LoginInput;
      const result = await AuthService.login(input);
      sendSuccess(res, result, 'Inicio de sesión exitoso');
    } catch (error) {
      next(error);
    }
  }

  static async registerParent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as RegisterParentInput;
      const result = await AuthService.registerParent(input);
      sendSuccess(res, result, 'Registro exitoso', HTTP_STATUS.CREATED);
    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body as RefreshTokenInput;
      const result = await AuthService.refreshToken(refreshToken);
      sendSuccess(res, result, 'Token renovado exitosamente');
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      await AuthService.logout(userId);
      sendSuccess(res, null, 'Sesión cerrada exitosamente');
    } catch (error) {
      next(error);
    }
  }

  static async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await AuthService.getMe(req.user!.id);
      sendSuccess(res, user, 'Usuario autenticado');
    } catch (error) {
      next(error);
    }
  }
}
