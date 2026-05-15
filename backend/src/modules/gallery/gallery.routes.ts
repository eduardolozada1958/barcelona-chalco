import { Router } from 'express';
import { authMiddleware } from '@middlewares/auth.middleware';
import { requireAdminOrCoach } from '@middlewares/role.middleware';
import { validateBody, validateParams, validateQuery } from '@middlewares/validate.middleware';
import { GalleryController } from './gallery.controller';
import { runGalleryMediaUpload } from './gallery.media.middleware';
import {
  listGalleryQuerySchema,
  galleryPostIdParamSchema,
  createGalleryPostBodySchema,
  updateGalleryPostBodySchema,
} from './gallery.validation';

export const galleryRouter = Router();

galleryRouter.get(
  '/public',
  validateQuery(listGalleryQuerySchema),
  GalleryController.listPublic
);

galleryRouter.get(
  '/public/:id',
  validateParams(galleryPostIdParamSchema),
  GalleryController.getPublicById
);

galleryRouter.get(
  '/',
  authMiddleware,
  requireAdminOrCoach,
  validateQuery(listGalleryQuerySchema),
  GalleryController.listAdmin
);

galleryRouter.post(
  '/with-media',
  authMiddleware,
  requireAdminOrCoach,
  runGalleryMediaUpload,
  GalleryController.createWithMedia
);

galleryRouter.post(
  '/',
  authMiddleware,
  requireAdminOrCoach,
  validateBody(createGalleryPostBodySchema),
  GalleryController.create
);

galleryRouter.put(
  '/:id',
  authMiddleware,
  requireAdminOrCoach,
  validateParams(galleryPostIdParamSchema),
  validateBody(updateGalleryPostBodySchema),
  GalleryController.update
);

galleryRouter.patch(
  '/:id/publish',
  authMiddleware,
  requireAdminOrCoach,
  validateParams(galleryPostIdParamSchema),
  GalleryController.publish
);

galleryRouter.delete(
  '/:id',
  authMiddleware,
  requireAdminOrCoach,
  validateParams(galleryPostIdParamSchema),
  GalleryController.softDelete
);
