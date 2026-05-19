import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validateBody } from '@middlewares/validate.middleware';
import { authMiddleware } from '@middlewares/auth.middleware';
import {
  loginSchema,
  registerParentSchema,
  refreshTokenSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  loginTotpSchema,
  totpCodeSchema,
  totpDisableSchema,
  updateProfileSchema,
  changePasswordSchema,
} from './auth.validation';
import { runProfileAvatarUpload } from './profile-avatar.middleware';

export const authRouter = Router();

// POST /api/v1/auth/login
authRouter.post('/login',
  validateBody(loginSchema),
  AuthController.login
);

// POST /api/v1/auth/login/totp — segundo paso si el usuario tiene 2FA
authRouter.post('/login/totp',
  validateBody(loginTotpSchema),
  AuthController.loginVerifyTotp
);

// POST /api/v1/auth/register
authRouter.post('/register',
  validateBody(registerParentSchema),
  AuthController.registerParent
);

// POST /api/v1/auth/verify-email
authRouter.post('/verify-email',
  validateBody(verifyEmailSchema),
  AuthController.verifyEmail
);

// POST /api/v1/auth/resend-verification
authRouter.post('/resend-verification',
  validateBody(resendVerificationSchema),
  AuthController.resendVerification
);

// POST /api/v1/auth/refresh
authRouter.post('/refresh',
  validateBody(refreshTokenSchema),
  AuthController.refreshToken
);

// POST /api/v1/auth/logout
authRouter.post('/logout',
  authMiddleware,
  AuthController.logout
);

// GET /api/v1/auth/me
authRouter.get('/me',
  authMiddleware,
  AuthController.me
);

// 2FA (TOTP / Google Authenticator) — opcional
authRouter.get('/totp/status', authMiddleware, AuthController.totpStatus);
authRouter.post('/totp/setup', authMiddleware, AuthController.totpSetup);
authRouter.post('/totp/confirm', authMiddleware, validateBody(totpCodeSchema), AuthController.totpConfirm);
authRouter.post('/totp/disable', authMiddleware, validateBody(totpDisableSchema), AuthController.totpDisable);

// Perfil personal (admin, coach, padre)
authRouter.patch('/profile', authMiddleware, validateBody(updateProfileSchema), AuthController.updateProfile);
authRouter.post('/change-password', authMiddleware, validateBody(changePasswordSchema), AuthController.changePassword);
authRouter.post('/avatar', authMiddleware, runProfileAvatarUpload, AuthController.uploadAvatar);
