import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { sendSuccess } from '@shared/utils/response';
import { ValidationError } from '@middlewares/error.middleware';
import { HTTP_STATUS } from '@config/constants';
import { TotpService } from './totp.service';
import { ProfileService } from './profile.service';
import { PasswordResetService } from './password-reset.service';
import type {
  LoginInput,
  RegisterParentInput,
  RefreshTokenInput,
  VerifyEmailInput,
  ResendVerificationInput,
  TotpCodeInput,
  LoginTotpInput,
  TotpDisableInput,
  UpdateProfileInput,
  ChangePasswordInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from './auth.validation';

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
      sendSuccess(
        res,
        result,
        'Revisa tu correo para confirmar la cuenta antes de iniciar sesión.',
        HTTP_STATUS.CREATED,
      );
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

  static async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.body as VerifyEmailInput;
      await AuthService.verifyEmail(token);
      sendSuccess(res, null, 'Correo verificado correctamente. Ya puedes iniciar sesión.');
    } catch (error) {
      next(error);
    }
  }

  static async resendVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body as ResendVerificationInput;
      await AuthService.resendVerificationEmail(email);
      sendSuccess(
        res,
        null,
        'Si el correo está registrado y pendiente de verificación, recibirás un nuevo enlace.',
      );
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

  static async loginVerifyTotp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { pendingToken, code } = req.body as LoginTotpInput;
      const result = await AuthService.loginVerifyTotp(pendingToken, code);
      sendSuccess(res, result, 'Inicio de sesión exitoso');
    } catch (error) {
      next(error);
    }
  }

  static async totpStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = await TotpService.getStatus(req.user!.id);
      sendSuccess(res, status, 'Estado 2FA');
    } catch (error) {
      next(error);
    }
  }

  static async totpSetup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const setup = await TotpService.beginSetup(req.user!.id, req.user!.email);
      sendSuccess(res, setup, 'Escanea el código QR con Google Authenticator');
    } catch (error) {
      next(error);
    }
  }

  static async totpConfirm(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code } = req.body as TotpCodeInput;
      const result = await TotpService.confirmSetup(req.user!.id, code);
      sendSuccess(res, result, 'Verificación en dos pasos activada');
    } catch (error) {
      next(error);
    }
  }

  static async totpDisable(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { password, code } = req.body as TotpDisableInput;
      await TotpService.disable(req.user!.id, password, code);
      sendSuccess(res, null, 'Verificación en dos pasos desactivada');
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await ProfileService.updateProfile(req.user!.id, req.body as UpdateProfileInput);
      sendSuccess(res, user, 'Perfil actualizado');
    } catch (error) {
      next(error);
    }
  }

  static async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await ProfileService.changePassword(req.user!.id, req.body as ChangePasswordInput);
      sendSuccess(res, null, 'Contraseña actualizada');
    } catch (error) {
      next(error);
    }
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body as ForgotPasswordInput;
      await PasswordResetService.requestReset(email);
      sendSuccess(
        res,
        null,
        'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña en unos minutos.',
      );
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as ResetPasswordInput;
      await PasswordResetService.resetPassword(input);
      sendSuccess(
        res,
        null,
        'Contraseña actualizada. Ya puedes iniciar sesión. Revisa tu correo para confirmación.',
      );
    } catch (error) {
      next(error);
    }
  }

  static async uploadAvatar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const f = req.file;
      if (!f) {
        return next(new ValidationError('Adjunta una imagen (PNG, JPEG o WebP)'));
      }
      const user = await ProfileService.uploadAvatar(req.user!.id, {
        buffer:   f.buffer,
        mimetype: f.mimetype,
        size:     f.size,
      });
      sendSuccess(res, user, 'Foto de perfil actualizada');
    } catch (error) {
      next(error);
    }
  }
}
