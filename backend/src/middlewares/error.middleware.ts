import { Request, Response, NextFunction } from 'express';
import { isProd } from '@config/env';
import { logger } from '@shared/utils/logger';
import { HTTP_STATUS } from '@config/constants';

// Clase base para errores de aplicación
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errors: { field?: string; message: string }[];

  constructor(
    message: string,
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    errors: { field?: string; message: string }[] = []
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Recurso no encontrado') {
    super(message, HTTP_STATUS.NOT_FOUND);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'No autorizado') {
    super(message, HTTP_STATUS.UNAUTHORIZED);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Acceso denegado') {
    super(message, HTTP_STATUS.FORBIDDEN);
  }
}

export class ValidationError extends AppError {
  constructor(
    message = 'Error de validación',
    errors: { field?: string; message: string }[] = []
  ) {
    super(message, HTTP_STATUS.UNPROCESSABLE_ENTITY, errors);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflicto de datos') {
    super(message, HTTP_STATUS.CONFLICT);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Solicitud inválida') {
    super(message, HTTP_STATUS.BAD_REQUEST);
  }
}

// Middleware global de manejo de errores
export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // JSON mal formado (body-parser / express.json)
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'JSON inválido en el cuerpo de la petición',
      errors:  [],
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors:  err.errors,
    });
    return;
  }

  // Error no operacional (bug real)
  logger.error('Error no controlado:', {
    requestId: req.requestId,
    name:      err.name,
    message:   err.message,
    stack:     err.stack,
  });

  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: isProd
      ? 'Error interno del servidor'
      : err.message,
    errors: isProd ? [] : [{ message: err.stack ?? err.message }],
  });
}
