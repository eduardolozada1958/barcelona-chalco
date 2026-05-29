import { supabaseAdmin } from '@config/database';
import { phoneToWhatsAppJid } from './phone';

export type WhatsAppLinkStatus = 'linked' | 'pending' | 'unlinked' | 'rejected_only';

export type WhatsAppSkipReason =
  | 'opted_out'
  | 'no_approved_child'
  | 'email_not_verified'
  | 'account_not_active'
  | 'no_phone'
  | 'duplicate_phone';

export type ParentWhatsAppCandidate = {
  parentId: string;
  userId: string;
  name: string;
  email: string;
  phoneRaw: string;
  jid: string | null;
  linkStatus: WhatsAppLinkStatus;
  approvedChildren: number;
  pendingChildren: number;
  rejectedChildren: number;
  clubBroadcastEligible: boolean;
  ineligibleReason: WhatsAppSkipReason | null;
};

function linkStatusFromCounts(approved: number, pending: number, rejected: number): WhatsAppLinkStatus {
  if (approved > 0) return 'linked';
  if (pending > 0) return 'pending';
  if (rejected > 0) return 'rejected_only';
  return 'unlinked';
}

/** Todos los padres del club con estado de vínculo y elegibilidad para avisos masivos. */
export async function listAllParentWhatsAppCandidates(): Promise<ParentWhatsAppCandidate[]> {
  const { data: parents, error } = await supabaseAdmin
    .from('parents')
    .select('id, user_id, first_name, last_name, phone_primary, whatsapp_notify_enabled')
    .is('deleted_at', null);

  if (error) throw new Error(error.message);
  if (!parents?.length) return [];

  const parentIds = parents.map((p) => String((p as { id: string }).id));
  const userIds = [...new Set(parents.map((p) => String((p as { user_id: string }).user_id)))];

  const { data: users, error: uErr } = await supabaseAdmin
    .from('users')
    .select('id, email, status, email_verified, role, phone')
    .in('id', userIds)
    .is('deleted_at', null)
    .eq('role', 'parent');

  if (uErr) throw new Error(uErr.message);

  const userById = new Map(
    (users ?? []).map((u) => [String((u as { id: string }).id), u as Record<string, unknown>]),
  );

  const linkCounts = new Map<string, { approved: number; pending: number; rejected: number }>();
  const { data: links, error: lErr } = await supabaseAdmin
    .from('parent_players')
    .select('parent_id, status')
    .in('parent_id', parentIds);

  if (lErr) throw new Error(lErr.message);

  for (const row of links ?? []) {
    const pid = String((row as { parent_id: string }).parent_id);
    const st = String((row as { status: string }).status);
    const cur = linkCounts.get(pid) ?? { approved: 0, pending: 0, rejected: 0 };
    if (st === 'approved') cur.approved += 1;
    else if (st === 'pending') cur.pending += 1;
    else if (st === 'rejected') cur.rejected += 1;
    linkCounts.set(pid, cur);
  }

  const seenJid = new Set<string>();
  const out: ParentWhatsAppCandidate[] = [];

  for (const row of parents) {
    const p = row as {
      id: string;
      user_id: string;
      first_name: string;
      last_name: string;
      phone_primary?: string | null;
      whatsapp_notify_enabled?: boolean;
    };

    const user = userById.get(p.user_id);
    if (!user) continue;

    const counts = linkCounts.get(p.id) ?? { approved: 0, pending: 0, rejected: 0 };
    const linkStatus = linkStatusFromCounts(counts.approved, counts.pending, counts.rejected);
    const phoneRaw =
      String(user.phone ?? '').trim() || String(p.phone_primary ?? '').trim();
    const jid = phoneToWhatsAppJid(phoneRaw);
    const name = `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || String(user.email ?? 'Padre');

    let ineligibleReason: WhatsAppSkipReason | null = null;

    if (!p.whatsapp_notify_enabled) {
      ineligibleReason = 'opted_out';
    } else if (user.status !== 'active') {
      ineligibleReason = 'account_not_active';
    } else if (!user.email_verified) {
      ineligibleReason = 'email_not_verified';
    } else if (counts.approved === 0) {
      ineligibleReason = 'no_approved_child';
    } else if (!jid) {
      ineligibleReason = 'no_phone';
    } else if (seenJid.has(jid)) {
      ineligibleReason = 'duplicate_phone';
    }

    if (jid && !ineligibleReason) {
      seenJid.add(jid);
    }

    out.push({
      parentId:     p.id,
      userId:       p.user_id,
      name,
      email:        String(user.email ?? ''),
      phoneRaw,
      jid,
      linkStatus,
      approvedChildren: counts.approved,
      pendingChildren:  counts.pending,
      rejectedChildren: counts.rejected,
      clubBroadcastEligible: ineligibleReason === null,
      ineligibleReason,
    });
  }

  return out.sort((a, b) => a.name.localeCompare(b.name, 'es'));
}
