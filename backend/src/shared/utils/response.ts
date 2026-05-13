import { Response } from 'express';
import { HTTP_STATUS } from '@config/constants';
import type { ApiResponse, ApiError, PaginationMeta } from '@shared/types';

// Respuesta exitosa estándar
export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'Operación exitosa',
  statusCode: number = HTTP_STATUS.OK,
  meta?: PaginationMeta
): Response {
  const body: ApiResponse<T> = {
    success: true,
    message,
    data,
    ...(meta ? { meta } : {}),
  };
  return res.status(statusCode).json(body);
}

// Respuesta de error estándar
export function sendError(
  res: Response,
  message: string,
  statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  errors: ApiError[] = []
): Response {
  const body: ApiResponse = {
    success: false,
    message,
    errors,
  };
  return res.status(statusCode).json(body);
}

// Construye metadatos de paginación
export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

// Calcula el offset para la paginación
export function getPaginationOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}
