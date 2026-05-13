import { supabaseAdmin } from '@config/database';
import { NotFoundError, BadRequestError, ConflictError } from '@middlewares/error.middleware';
import { buildPaginationMeta, getPaginationOffset } from '@shared/utils/response';
import type {
  ListInscriptionsQuery,
  PublicInscriptionBody,
  ApproveInscriptionBody,
  RejectInscriptionBody,
} from './inscriptions.validation';

export class InscriptionsService {
  static async createPublic(input: PublicInscriptionBody, ip: string | null) {
    const { data, error } = await supabaseAdmin
      .from('inscriptions')
      .insert({
        parent_first_name:        input.parentFirstName,
        parent_last_name:         input.parentLastName,
        parent_email:             input.parentEmail.toLowerCase(),
        parent_phone:             input.parentPhone,
        parent_relationship:      input.parentRelationship,
        player_first_name:        input.playerFirstName,
        player_last_name:         input.playerLastName,
        player_birth_date:        input.playerBirthDate,
        player_nationality:       input.playerNationality,
        player_position:          input.playerPosition,
        player_dominant_foot:     input.playerDominantFoot,
        player_height_cm:         input.playerHeightCm ?? null,
        player_weight_kg:         input.playerWeightKg ?? null,
        player_category:          input.playerCategory,
        player_previous_club:     input.playerPreviousClub ?? null,
        player_sport_description: input.playerSportDescription ?? null,
        player_avatar_url:        input.playerAvatarUrl ?? null,
        ip_address:               ip,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  static async list(opts: ListInscriptionsQuery) {
    let query = supabaseAdmin
      .from('inscriptions')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(
        getPaginationOffset(opts.page, opts.limit),
        getPaginationOffset(opts.page, opts.limit) + opts.limit - 1
      );

    if (opts.status)   query = query.eq('status', opts.status);
    if (opts.category) query = query.eq('player_category', opts.category);

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);
    return { data: data ?? [], meta: buildPaginationMeta(count ?? 0, opts.page, opts.limit) };
  }

  static async getById(id: string) {
    const { data, error } = await supabaseAdmin
      .from('inscriptions')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error || !data) throw new NotFoundError('Inscripción no encontrada');
    return data;
  }

  static async approve(id: string, reviewerId: string, input: ApproveInscriptionBody) {
    const row = await InscriptionsService.getById(id);
    if (row.status === 'approved') throw new ConflictError('La inscripción ya está aprobada');
    if (row.status === 'rejected') throw new BadRequestError('No se puede aprobar una inscripción rechazada');

    const { data, error } = await supabaseAdmin
      .from('inscriptions')
      .update({
        status:       'approved',
        reviewed_by:  reviewerId,
        reviewed_at:  new Date().toISOString(),
        review_notes: input.reviewNotes ?? null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  static async reject(id: string, reviewerId: string, input: RejectInscriptionBody) {
    await InscriptionsService.getById(id);

    const { data, error } = await supabaseAdmin
      .from('inscriptions')
      .update({
        status:             'rejected',
        reviewed_by:        reviewerId,
        reviewed_at:        new Date().toISOString(),
        review_notes:       input.reviewNotes ?? null,
        rejection_reason:   input.rejectionReason,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  static async convert(id: string, reviewerId: string) {
    const row = await InscriptionsService.getById(id);
    if (row.status !== 'approved') {
      throw new BadRequestError('Solo inscripciones aprobadas pueden convertirse en jugador');
    }
    if (row.converted_player_id) {
      throw new ConflictError('Esta inscripción ya fue convertida');
    }

    const { data: playerId, error } = await supabaseAdmin.rpc('convert_inscription_to_player', {
      p_inscription_id: id,
      p_reviewed_by:    reviewerId,
    });

    if (error) throw new BadRequestError(error.message);

    return { playerId: playerId as string };
  }
}
