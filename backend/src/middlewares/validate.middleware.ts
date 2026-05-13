import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from './error.middleware';

// Valida req.body con el schema Zod proporcionado
export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = formatZodErrors(result.error);
      return next(new ValidationError('Error de validación', errors));
    }

    req.body = result.data;
    next();
  };
}

// Valida req.params
export function validateParams(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      const errors = formatZodErrors(result.error);
      return next(new ValidationError('Parámetros inválidos', errors));
    }

    req.params = result.data as typeof req.params;
    next();
  };
}

// Valida req.query
export function validateQuery(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const errors = formatZodErrors(result.error);
      return next(new ValidationError('Query inválido', errors));
    }

    req.validatedQuery = result.data;
    next();
  };
}

function formatZodErrors(error: ZodError): { field: string; message: string }[] {
  return error.errors.map((e) => ({
    field:   e.path.join('.'),
    message: e.message,
  }));
}
