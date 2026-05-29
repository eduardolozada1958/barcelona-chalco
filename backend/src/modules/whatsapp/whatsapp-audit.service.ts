import { supabaseAdmin } from '@config/database';
import { buildPaginationMeta, getPaginationOffset } from '@shared/utils/response';
import { formatPhoneForDisplay } from './phone';
import { WHATSAPP_KIND_LABELS, skipReasonLabel } from './whatsapp-audit.labels';

export type DeliveryOutcome = 'sent' | 'failed' | 'skipped';

export type DeliveryLogRow = {
  parentId: string | null;
  userId: string | null;
  parentName: string;
  email: string | null;
  phoneMasked: string | null;
  linkStatus: string;
  approvedChildren: number;
  pendingChildren: number;
  outcome: DeliveryOutcome;
  skipReason: string | null;
  errorMessage: string | null;
};

function maskPhone(phoneRaw: string): string | null {
  const digits = phoneRaw.replace(/\D/g, '');
  if (digits.length < 4) return null;
  return `***${digits.slice(-4)}`;
}

export class WhatsAppAuditService {
  static async createBatch(input: {
    kind: string;
    referenceId?: string | null;
    title: string;
    messagePreview?: string | null;
  }): Promise<string> {
    const { data, error } = await supabaseAdmin
      .from('whatsapp_delivery_batches')
      .insert({
        kind:            input.kind,
        reference_id:    input.referenceId ?? null,
        title:           input.title,
        message_preview: input.messagePreview?.slice(0, 500) ?? null,
      })
      .select('id')
      .single();

    if (error || !data) throw new Error(error?.message ?? 'No se pudo crear lote de auditoría WA');
    return String((data as { id: string }).id);
  }

  static async appendLogs(batchId: string, rows: DeliveryLogRow[]): Promise<void> {
    if (!rows.length) return;

    const payload = rows.map((r) => ({
      batch_id:          batchId,
      parent_id:         r.parentId,
      user_id:           r.userId,
      parent_name:       r.parentName,
      email:             r.email,
      phone_masked:      r.phoneMasked,
      link_status:       r.linkStatus,
      approved_children: r.approvedChildren,
      pending_children:  r.pendingChildren,
      outcome:           r.outcome,
      skip_reason:       r.skipReason,
      error_message:     r.errorMessage,
    }));

    const { error } = await supabaseAdmin.from('whatsapp_delivery_log').insert(payload);
    if (error) throw new Error(error.message);
  }

  static async finishBatch(
    batchId: string,
    counts: { sent: number; failed: number; skipped: number },
  ): Promise<void> {
    const { error } = await supabaseAdmin
      .from('whatsapp_delivery_batches')
      .update({
        sent_count:    counts.sent,
        failed_count:  counts.failed,
        skipped_count: counts.skipped,
        finished_at:   new Date().toISOString(),
      })
      .eq('id', batchId);

    if (error) throw new Error(error.message);
  }

  static async listBatches(opts: { page: number; limit: number }) {
    const { data, error, count } = await supabaseAdmin
      .from('whatsapp_delivery_batches')
      .select('id, kind, reference_id, title, message_preview, sent_count, failed_count, skipped_count, created_at, finished_at', {
        count: 'exact',
      })
      .order('created_at', { ascending: false })
      .range(
        getPaginationOffset(opts.page, opts.limit),
        getPaginationOffset(opts.page, opts.limit) + opts.limit - 1,
      );

    if (error) throw new Error(error.message);

    const rows = (data ?? []).map((row) => {
      const r = row as Record<string, unknown>;
      const kind = String(r.kind ?? '');
      return {
        id:             String(r.id),
        kind,
        kindLabel:      WHATSAPP_KIND_LABELS[kind] ?? kind,
        referenceId:    r.reference_id ? String(r.reference_id) : null,
        title:          String(r.title ?? ''),
        messagePreview: r.message_preview ? String(r.message_preview) : null,
        sentCount:      Number(r.sent_count ?? 0),
        failedCount:    Number(r.failed_count ?? 0),
        skippedCount:   Number(r.skipped_count ?? 0),
        createdAt:      String(r.created_at ?? ''),
        finishedAt:     r.finished_at ? String(r.finished_at) : null,
      };
    });

    return { data: rows, meta: buildPaginationMeta(count ?? 0, opts.page, opts.limit) };
  }

  static async getBatchDetail(batchId: string) {
    const { data: batch, error: bErr } = await supabaseAdmin
      .from('whatsapp_delivery_batches')
      .select('*')
      .eq('id', batchId)
      .maybeSingle();

    if (bErr) throw new Error(bErr.message);
    if (!batch) return null;

    const { data: logs, error: lErr } = await supabaseAdmin
      .from('whatsapp_delivery_log')
      .select('*')
      .eq('batch_id', batchId)
      .order('outcome', { ascending: true })
      .order('parent_name', { ascending: true });

    if (lErr) throw new Error(lErr.message);

    const b = batch as Record<string, unknown>;
    const kind = String(b.kind ?? '');

    return {
      batch: {
        id:             String(b.id),
        kind,
        kindLabel:      WHATSAPP_KIND_LABELS[kind] ?? kind,
        referenceId:    b.reference_id ? String(b.reference_id) : null,
        title:          String(b.title ?? ''),
        messagePreview: b.message_preview ? String(b.message_preview) : null,
        sentCount:      Number(b.sent_count ?? 0),
        failedCount:    Number(b.failed_count ?? 0),
        skippedCount:   Number(b.skipped_count ?? 0),
        createdAt:      String(b.created_at ?? ''),
        finishedAt:     b.finished_at ? String(b.finished_at) : null,
      },
      entries: (logs ?? []).map((row) => {
        const r = row as Record<string, unknown>;
        const skipReason = r.skip_reason ? String(r.skip_reason) : null;
        return {
          id:               String(r.id),
          parentId:         r.parent_id ? String(r.parent_id) : null,
          userId:           r.user_id ? String(r.user_id) : null,
          parentName:       String(r.parent_name ?? ''),
          email:            r.email ? String(r.email) : null,
          phoneMasked:      r.phone_masked ? String(r.phone_masked) : null,
          linkStatus:       String(r.link_status ?? 'unknown'),
          approvedChildren: Number(r.approved_children ?? 0),
          pendingChildren:  Number(r.pending_children ?? 0),
          outcome:          String(r.outcome ?? 'skipped') as DeliveryOutcome,
          skipReason,
          skipReasonLabel:  skipReasonLabel(skipReason),
          errorMessage:     r.error_message ? String(r.error_message) : null,
        };
      }),
    };
  }

  static logRowFromCandidate(
    c: {
      parentId: string;
      userId: string;
      name: string;
      email: string;
      phoneRaw: string;
      linkStatus: string;
      approvedChildren: number;
      pendingChildren: number;
    },
    outcome: DeliveryOutcome,
    skipReason: string | null,
    errorMessage?: string | null,
  ): DeliveryLogRow {
    return {
      parentId:         c.parentId,
      userId:           c.userId,
      parentName:       c.name,
      email:            c.email || null,
      phoneMasked:      c.phoneRaw ? maskPhone(c.phoneRaw) : formatPhoneForDisplay(c.phoneRaw) || null,
      linkStatus:       c.linkStatus,
      approvedChildren: c.approvedChildren,
      pendingChildren:  c.pendingChildren,
      outcome,
      skipReason,
      errorMessage:     errorMessage ?? null,
    };
  }
}
