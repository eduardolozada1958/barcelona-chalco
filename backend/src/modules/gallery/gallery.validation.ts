import { z } from 'zod';
import { CURRENT_SEASON } from '@config/constants';

const pagination = {
  page:  z.string().optional().transform(v => (v ? parseInt(v, 10) : 1)),
  limit: z.string().optional().transform(v => {
    const n = v ? parseInt(v, 10) : 20;
    return Math.min(100, Math.max(1, n));
  }),
} as const;

export const galleryPostIdParamSchema = z.object({
  id: z.string().uuid('ID inválido'),
});

export const listGalleryQuerySchema = z.object({
  ...pagination,
  type:   z
    .enum(['match_day', 'result', 'featured_player', 'training', 'convocatory', 'general', 'achievement'])
    .optional(),
  season: z.string().optional(),
});

const galleryMediaInput = z.object({
  url:           z.string().url(),
  type:          z.enum(['image', 'video']).default('image'),
  thumbnailUrl:  z.string().url().nullable().optional(),
  caption:       z.string().max(500).nullable().optional(),
  sortOrder:     z.number().int().min(0).max(100).default(0),
  fileSizeBytes: z.number().int().positive().nullable().optional(),
  widthPx:       z.number().int().positive().nullable().optional(),
  heightPx:      z.number().int().positive().nullable().optional(),
});

export const createGalleryPostBodySchema = z.object({
  title:            z.string().min(3).max(200),
  caption:          z.string().max(5000).nullable().optional(),
  type:             z
    .enum(['match_day', 'result', 'featured_player', 'training', 'convocatory', 'general', 'achievement'])
    .default('general'),
  relatedMatchId:   z.string().uuid().nullable().optional(),
  relatedPlayerId:  z.string().uuid().nullable().optional(),
  isFeatured:       z.boolean().default(false),
  season:           z.string().max(20).default(CURRENT_SEASON),
  media:            z.array(galleryMediaInput).max(20).default([]),
});

export const updateGalleryPostBodySchema = createGalleryPostBodySchema
  .omit({ media: true })
  .partial()
  .extend({
    media: z.array(galleryMediaInput).max(20).optional(),
  });

const galleryTypeEnum = z.enum([
  'match_day',
  'result',
  'featured_player',
  'training',
  'convocatory',
  'general',
  'achievement',
]);

function fieldToBool(v: unknown): boolean {
  return v === true || v === 'true' || v === 'on' || v === '1';
}

export const createGalleryUploadFieldsSchema = z.object({
  title:   z.string().min(3).max(200),
  caption: z
    .string()
    .max(5000)
    .optional()
    .transform((v) => (v && v.trim().length > 0 ? v.trim() : null)),
  type:       galleryTypeEnum.default('general'),
  isFeatured: z.preprocess(fieldToBool, z.boolean()).optional().default(false),
  publish:    z.preprocess(fieldToBool, z.boolean()).optional().default(false),
  season:     z.string().max(20).default(CURRENT_SEASON),
});

export type ListGalleryQuery = z.infer<typeof listGalleryQuerySchema>;
export type CreateGalleryPostBody = z.infer<typeof createGalleryPostBodySchema>;
export type UpdateGalleryPostBody = z.infer<typeof updateGalleryPostBodySchema>;
export type CreateGalleryUploadFields = z.infer<typeof createGalleryUploadFieldsSchema>;
