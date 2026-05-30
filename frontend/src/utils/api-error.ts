import type { AxiosError } from 'axios';
import type { ApiResponse } from '@/api/types';

const STATUS_MESSAGES: Record<number, string> = {
  400: 'Solicitud incorrecta. Revisa los datos.',
  401: 'Correo o contraseña incorrectos.',
  403: 'No tienes permiso para realizar esta acción.',
  404: 'No encontramos lo que buscas.',
  405: 'No se pudo conectar con el servidor. Intenta de nuevo en unos minutos.',
  408: 'La solicitud tardó demasiado. Intenta de nuevo.',
  422: 'Revisa los datos del formulario.',
  429: 'Demasiados intentos. Espera unos minutos.',
  500: 'Error en el servidor. Intenta más tarde.',
  502: 'El servidor no responde. Intenta en unos minutos.',
  503: 'Servicio no disponible temporalmente.',
};

function isTechnicalMessage(msg: string): boolean {
  return /request failed|status code \d{3}|network error|axios|econnrefused|etimedout|timeout of \d+ms|ERR_/i.test(msg);
}

/** Mensaje legible en español para errores de API (toast, formularios). */
export function getApiErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return 'Ocurrió un error. Intenta de nuevo.';
  }

  const err = error as Error & { status?: number; payload?: ApiResponse };

  if (err.payload?.errors?.length) {
    const first = err.payload.errors[0]?.message;
    if (first && !isTechnicalMessage(first)) return first;
  }

  if (err.payload?.message && !isTechnicalMessage(err.payload.message)) {
    return err.payload.message;
  }

  const status = err.status ?? (error as AxiosError).response?.status;
  if (status && STATUS_MESSAGES[status]) {
    return STATUS_MESSAGES[status];
  }

  if (err.message && !isTechnicalMessage(err.message)) {
    return err.message;
  }

  return 'Ocurrió un error. Intenta de nuevo.';
}
