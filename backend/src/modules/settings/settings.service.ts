import { supabaseAdmin } from '@config/database';
import { NotFoundError } from '@middlewares/error.middleware';
import type { UpdateSettingsBody } from './settings.validation';

export class SettingsService {
  static async getActiveRow() {
    const { data, error } = await supabaseAdmin
      .from('club_settings')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) throw new NotFoundError('Configuración del club no encontrada');
    return data;
  }

  static async getPublic() {
    const row = await SettingsService.getActiveRow();
    return {
      clubName:        row.club_name,
      clubLogoUrl:     row.club_logo_url,
      clubDescription: row.club_description,
      season:          row.season,
      primaryColor:    row.primary_color,
      secondaryColor:  row.secondary_color,
      accentColor:     row.accent_color,
      contactEmail:    row.contact_email,
      contactPhone:    row.contact_phone,
      contactAddress:  row.contact_address,
      websiteUrl:      row.website_url,
      instagramUrl:    row.instagram_url,
      facebookUrl:     row.facebook_url,
      twitterUrl:      row.twitter_url,
    };
  }

  static async update(input: UpdateSettingsBody) {
    const row = await SettingsService.getActiveRow();

    const u: Record<string, unknown> = {};
    if (input.clubName !== undefined)         u.club_name         = input.clubName;
    if (input.clubLogoUrl !== undefined)    u.club_logo_url     = input.clubLogoUrl;
    if (input.clubDescription !== undefined) u.club_description = input.clubDescription;
    if (input.season !== undefined)         u.season            = input.season;
    if (input.primaryColor !== undefined)   u.primary_color     = input.primaryColor;
    if (input.secondaryColor !== undefined) u.secondary_color   = input.secondaryColor;
    if (input.accentColor !== undefined)    u.accent_color      = input.accentColor;
    if (input.contactEmail !== undefined)   u.contact_email     = input.contactEmail;
    if (input.contactPhone !== undefined)   u.contact_phone     = input.contactPhone;
    if (input.contactAddress !== undefined) u.contact_address   = input.contactAddress;
    if (input.websiteUrl !== undefined)     u.website_url       = input.websiteUrl;
    if (input.instagramUrl !== undefined)   u.instagram_url     = input.instagramUrl;
    if (input.facebookUrl !== undefined)    u.facebook_url      = input.facebookUrl;
    if (input.twitterUrl !== undefined)     u.twitter_url       = input.twitterUrl;
    if (input.isActive !== undefined)       u.is_active         = input.isActive;

    if (Object.keys(u).length === 0) return row;

    const { data, error } = await supabaseAdmin
      .from('club_settings')
      .update(u)
      .eq('id', row.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }
}
