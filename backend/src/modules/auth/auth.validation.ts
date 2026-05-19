import { z } from 'zod';

export const loginSchema = z.object({
  email:    z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export const registerParentSchema = z.object({
  email:     z.string().email('Email inválido'),
  password:  z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número')
    .regex(/[^A-Za-z0-9]/, 'Debe contener al menos un carácter especial'),
  fullName:   z.string().min(3, 'El nombre completo debe tener al menos 3 caracteres').max(150),
  phone:      z.string().optional(),
  firstName:  z.string().min(2).max(100),
  lastName:   z.string().min(2).max(100),
  phonePrimary:   z.string().min(7).max(30),
  relationship:   z.enum(['padre', 'madre', 'tutor', 'tutora', 'abuelo', 'abuela', 'tio', 'tia', 'otro']),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'refreshToken requerido'),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(32, 'Token inválido'),
});

export const resendVerificationSchema = z.object({
  email: z.string().email('Email inválido'),
});

export const totpCodeSchema = z.object({
  code: z
    .string()
    .min(6, 'Código requerido')
    .max(16, 'Código inválido'),
});

export const loginTotpSchema = z.object({
  pendingToken: z.string().min(10, 'Token de verificación requerido'),
  code:         z.string().min(6).max(16),
});

export const totpDisableSchema = z.object({
  password: z.string().min(6, 'Contraseña requerida'),
  code:     z.string().min(6).max(16),
});

export type LoginInput           = z.infer<typeof loginSchema>;
export type TotpCodeInput        = z.infer<typeof totpCodeSchema>;
export type LoginTotpInput       = z.infer<typeof loginTotpSchema>;
export type TotpDisableInput     = z.infer<typeof totpDisableSchema>;
export type RegisterParentInput  = z.infer<typeof registerParentSchema>;
export type RefreshTokenInput    = z.infer<typeof refreshTokenSchema>;
export type VerifyEmailInput     = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
