import { z } from 'zod';

export const updateSettingsBodySchema = z.object({
  clubName:         z.string().min(2).max(150).optional(),
  clubLogoUrl:      z.string().url().nullable().optional(),
  clubDescription:  z.string().max(5000).nullable().optional(),
  season:           z.string().min(4).max(20).optional(),
  primaryColor:     z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .nullable()
    .optional(),
  secondaryColor:   z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .nullable()
    .optional(),
  accentColor:      z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .nullable()
    .optional(),
  contactEmail:     z.string().email().nullable().optional(),
  contactPhone:     z.string().max(30).nullable().optional(),
  contactAddress:   z.string().max(500).nullable().optional(),
  websiteUrl:       z.string().url().nullable().optional(),
  instagramUrl:     z.string().url().nullable().optional(),
  facebookUrl:      z.string().url().nullable().optional(),
  twitterUrl:       z.string().url().nullable().optional(),
  isActive:         z.boolean().optional(),
});

export type UpdateSettingsBody = z.infer<typeof updateSettingsBodySchema>;
