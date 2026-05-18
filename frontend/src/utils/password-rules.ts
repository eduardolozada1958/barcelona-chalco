import { z } from 'zod';

/** Mismas reglas que el backend (auth.register). */
export const passwordFieldSchema = z
  .string()
  .min(8, 'Mínimo 8 caracteres')
  .regex(/[A-Z]/, 'Incluye al menos una mayúscula')
  .regex(/[0-9]/, 'Incluye al menos un número')
  .regex(/[^A-Za-z0-9]/, 'Incluye un carácter especial (ej. ! @ #)');

export const PASSWORD_HINT =
  'Mínimo 8 caracteres, una mayúscula, un número y un carácter especial (! @ # …).';
