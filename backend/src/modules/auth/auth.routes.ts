import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validateBody } from '@middlewares/validate.middleware';
import { authMiddleware } from '@middlewares/auth.middleware';
import { loginSchema, registerParentSchema, refreshTokenSchema } from './auth.validation';

export const authRouter = Router();

// POST /api/v1/auth/login
authRouter.post('/login',
  validateBody(loginSchema),
  AuthController.login
);

// POST /api/v1/auth/register
authRouter.post('/register',
  validateBody(registerParentSchema),
  AuthController.registerParent
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
