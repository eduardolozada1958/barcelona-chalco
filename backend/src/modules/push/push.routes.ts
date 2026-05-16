import { Router } from 'express';
import { validateBody } from '@middlewares/validate.middleware';
import { PushController } from './push.controller';
import { subscribePushBodySchema, unsubscribePushBodySchema } from './push.validation';

export const pushRouter = Router();

pushRouter.get('/public/vapid-key', PushController.getVapidPublicKey);

pushRouter.post(
  '/public/subscribe',
  validateBody(subscribePushBodySchema),
  PushController.subscribe,
);

pushRouter.post(
  '/public/unsubscribe',
  validateBody(unsubscribePushBodySchema),
  PushController.unsubscribe,
);
