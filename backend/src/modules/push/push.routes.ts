import { Router } from 'express';
import { validateBody } from '@middlewares/validate.middleware';
import { pushPublicLimiter } from '@middlewares/rate-limit.middleware';
import { PushController } from './push.controller';
import { subscribePushBodySchema, unsubscribePushBodySchema } from './push.validation';

export const pushRouter = Router();

pushRouter.get('/public/vapid-key', PushController.getVapidPublicKey);

pushRouter.post(
  '/public/subscribe',
  pushPublicLimiter,
  validateBody(subscribePushBodySchema),
  PushController.subscribe,
);

pushRouter.post(
  '/public/unsubscribe',
  pushPublicLimiter,
  validateBody(unsubscribePushBodySchema),
  PushController.unsubscribe,
);
