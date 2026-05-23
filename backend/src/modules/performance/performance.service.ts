import { supabaseAdmin } from '@config/database';
import { NotFoundError } from '@middlewares/error.middleware';
import { buildPaginationMeta, getPaginationOffset } from '@shared/utils/response';
import type {
  CreatePerformanceReportBody,
  ListPerformanceReportsQuery,
  UpdatePerformanceReportBody,
} from './performance.validation';

export type PerformanceEntry = {
  playerName: string;
  advance: string;
  difficulty?: string;
  playerId?: string | null;
};

function mapRow(row: Record<string, unknown>) {
  return {
    id:          String(row.id),
    title:       String(row.title),
    category:    String(row.category ?? 'General'),
    reportDate:  String(row.report_date).slice(0, 10),
    entries:     (row.entries ?? []) as PerformanceEntry[],
    isPublished: Boolean(row.is_published),
    publishedAt: row.published_at ? String(row.published_at) : null,
    createdAt:   String(row.created_at),
    updatedAt:   String(row.updated_at),
  };
}

export class PerformanceService {
  static async listPublic(opts: ListPerformanceReportsQuery) {
    const query = supabaseAdmin
      .from('performance_reports')
      .select('id, title, category, report_date, entries, published_at, created_at', { count: 'exact' })
      .eq('is_published', true)
      .is('deleted_at', null)
      .order('report_date', { ascending: false })
      .order('published_at', { ascending: false })
      .range(
        getPaginationOffset(opts.page, opts.limit),
        getPaginationOffset(opts.page, opts.limit) + opts.limit - 1,
      );

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);

    return {
      data: (data ?? []).map((r) => mapRow(r as Record<string, unknown>)),
      meta: buildPaginationMeta(count ?? 0, opts.page, opts.limit),
    };
  }

  static async getPublicById(id: string) {
    const { data, error } = await supabaseAdmin
      .from('performance_reports')
      .select('id, title, category, report_date, entries, published_at, created_at')
      .eq('id', id)
      .eq('is_published', true)
      .is('deleted_at', null)
      .single();

    if (error || !data) throw new NotFoundError('Informe no encontrado');
    return mapRow(data as Record<string, unknown>);
  }

  static async listAdmin(opts: ListPerformanceReportsQuery) {
    let query = supabaseAdmin
      .from('performance_reports')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
      .order('report_date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(
        getPaginationOffset(opts.page, opts.limit),
        getPaginationOffset(opts.page, opts.limit) + opts.limit - 1,
      );

    if (opts.published === 'true') query = query.eq('is_published', true);
    if (opts.published === 'false') query = query.eq('is_published', false);

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);

    return {
      data: (data ?? []).map((r) => mapRow(r as Record<string, unknown>)),
      meta: buildPaginationMeta(count ?? 0, opts.page, opts.limit),
    };
  }

  static async getById(id: string) {
    const { data, error } = await supabaseAdmin
      .from('performance_reports')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error || !data) throw new NotFoundError('Informe no encontrado');
    return mapRow(data as Record<string, unknown>);
  }

  static async create(input: CreatePerformanceReportBody, createdBy: string) {
    const { data, error } = await supabaseAdmin
      .from('performance_reports')
      .insert({
        title:       input.title,
        category:    input.category,
        report_date: input.reportDate,
        entries:     input.entries,
        created_by:  createdBy,
      })
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return mapRow(data as Record<string, unknown>);
  }

  static async update(id: string, input: UpdatePerformanceReportBody) {
    await PerformanceService.getById(id);

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (input.title !== undefined) patch.title = input.title;
    if (input.category !== undefined) patch.category = input.category;
    if (input.reportDate !== undefined) patch.report_date = input.reportDate;
    if (input.entries !== undefined) patch.entries = input.entries;

    const { data, error } = await supabaseAdmin
      .from('performance_reports')
      .update(patch)
      .eq('id', id)
      .is('deleted_at', null)
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return mapRow(data as Record<string, unknown>);
  }

  static async publish(id: string, publish: boolean) {
    await PerformanceService.getById(id);

    const { data, error } = await supabaseAdmin
      .from('performance_reports')
      .update({
        is_published: publish,
        published_at: publish ? new Date().toISOString() : null,
        updated_at:   new Date().toISOString(),
      })
      .eq('id', id)
      .is('deleted_at', null)
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return mapRow(data as Record<string, unknown>);
  }

  static async softDelete(id: string) {
    await PerformanceService.getById(id);

    const { error } = await supabaseAdmin
      .from('performance_reports')
      .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw new Error(error.message);
  }
}
