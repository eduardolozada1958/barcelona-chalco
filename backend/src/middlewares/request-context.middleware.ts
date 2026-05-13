import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { logger } from '@shared/utils/logger';

export function requestContextMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestId = randomUUID();
  req.requestId = requestId;
  req.log = logger.child({ requestId });
  res.setHeader('X-Request-Id', requestId);

  const start = Date.now();
  res.on('finish', () => {
    const durationMs = Date.now() - start;
    (req.log ?? logger).info('http_request', {
      method:     req.method,
      path:       req.originalUrl?.split('?')[0] ?? req.url,
      statusCode: res.statusCode,
      durationMs,
      userId:     req.user?.id,
    });
  });

  next();
}
