import { supabaseAdmin } from '@config/database';
import { phoneToWhatsAppJid } from './phone';

export type WhatsAppRecipient = {
  parentId: string;
  jid: string;
  label: string;
  phoneSource: 'phone_primary' | 'user_phone';
  phoneRaw: string;
};

export type WhatsAppRecipientDiagnostics = {
  eligible: number;
  optedOut: number;
  noPhone: number;
  emailNotVerified: number;
  accountNotActive: number;
  noApprovedChild: number;
  duplicatePhone: number;
};

/** Padres con opt-in activo, teléfono y al menos un hijo aprobado. */
export async function listVerifiedParentWhatsAppRecipients(): Promise<WhatsAppRecipient[]> {
  const { data: parents, error } = await supabaseAdmin
    .from('parents')
    .select('id, user_id, first_name, last_name, phone_primary, whatsapp_notify_enabled')
    .eq('whatsapp_notify_enabled', true)
    .is('deleted_at', null);

  if (error) throw new Error(error.message);
  if (!parents?.length) return [];

  const userIds = [...new Set(parents.map((p) => String((p as { user_id: string }).user_id)))];
  const { data: users, error: uErr } = await supabaseAdmin
    .from('users')
    .select('id, status, email_verified, role, phone')
    .in('id', userIds)
    .is('deleted_at', null)
    .eq('role', 'parent')
    .eq('status', 'active')
    .eq('email_verified', true);

  if (uErr) throw new Error(uErr.message);
  const userPhoneById = new Map<string, string>();
  const validUserIds = new Set<string>();
  for (const u of users ?? []) {
    const row = u as { id: string; phone?: string | null };
    validUserIds.add(String(row.id));
    if (row.phone?.trim()) userPhoneById.set(String(row.id), row.phone.trim());
  }

  const parentIds = parents
    .filter((p) => validUserIds.has(String((p as { user_id: string }).user_id)))
    .map((p) => String((p as { id: string }).id));

  if (parentIds.length === 0) return [];

  const { data: links, error: lErr } = await supabaseAdmin
    .from('parent_players')
    .select('parent_id')
    .in('parent_id', parentIds)
    .eq('status', 'approved');

  if (lErr) throw new Error(lErr.message);

  const withApprovedChild = new Set(
    (links ?? []).map((l) => String((l as { parent_id: string }).parent_id)),
  );

  const out: WhatsAppRecipient[] = [];
  const seenJid = new Set<string>();

  for (const row of parents) {
    const r = row as {
      id: string;
      user_id: string;
      first_name: string;
      last_name: string;
      phone_primary: string;
    };
    if (!validUserIds.has(r.user_id)) continue;
    if (!withApprovedChild.has(r.id)) continue;

    const primary = String(r.phone_primary ?? '').trim();
    const fromUser = userPhoneById.get(r.user_id) ?? '';
    const phoneRaw = fromUser || primary;
    const phoneSource: WhatsAppRecipient['phoneSource'] = fromUser ? 'user_phone' : 'phone_primary';
    const jid = phoneToWhatsAppJid(phoneRaw);
    if (!jid || seenJid.has(jid)) continue;
    seenJid.add(jid);

    out.push({
      parentId: r.id,
      jid,
      label: `${r.first_name ?? ''} ${r.last_name ?? ''}`.trim(),
      phoneSource,
      phoneRaw,
    });
  }

  return out;
}

/** Desglose para el panel admin: por qué algunos padres no reciben avisos. */
export async function getWhatsAppRecipientDiagnostics(): Promise<WhatsAppRecipientDiagnostics> {
  const { data: parents, error } = await supabaseAdmin
    .from('parents')
    .select('id, user_id, phone_primary, whatsapp_notify_enabled')
    .is('deleted_at', null);

  if (error) throw new Error(error.message);
  if (!parents?.length) {
    return {
      eligible: 0,
      optedOut: 0,
      noPhone: 0,
      emailNotVerified: 0,
      accountNotActive: 0,
      noApprovedChild: 0,
      duplicatePhone: 0,
    };
  }

  const userIds = [...new Set(parents.map((p) => String((p as { user_id: string }).user_id)))];
  const { data: users, error: uErr } = await supabaseAdmin
    .from('users')
    .select('id, status, email_verified, role, phone')
    .in('id', userIds)
    .is('deleted_at', null);

  if (uErr) throw new Error(uErr.message);

  const userById = new Map(
    (users ?? []).map((u) => [String((u as { id: string }).id), u as Record<string, unknown>]),
  );

  const parentIds = parents.map((p) => String((p as { id: string }).id));
  const { data: links, error: lErr } = await supabaseAdmin
    .from('parent_players')
    .select('parent_id')
    .in('parent_id', parentIds)
    .eq('status', 'approved');

  if (lErr) throw new Error(lErr.message);

  const withApprovedChild = new Set(
    (links ?? []).map((l) => String((l as { parent_id: string }).parent_id)),
  );

  let optedOut = 0;
  let noPhone = 0;
  let emailNotVerified = 0;
  let accountNotActive = 0;
  let noApprovedChild = 0;
  let duplicatePhone = 0;

  const seenJid = new Set<string>();
  let eligible = 0;

  for (const row of parents) {
    const p = row as {
      id: string;
      user_id: string;
      phone_primary?: string | null;
      whatsapp_notify_enabled?: boolean;
    };
    const user = userById.get(p.user_id);
    if (!user || user.role !== 'parent') continue;

    if (!p.whatsapp_notify_enabled) {
      optedOut += 1;
      continue;
    }
    if (user.status !== 'active') {
      accountNotActive += 1;
      continue;
    }
    if (!user.email_verified) {
      emailNotVerified += 1;
      continue;
    }
    if (!withApprovedChild.has(p.id)) {
      noApprovedChild += 1;
      continue;
    }

    const phoneRaw =
      String(user.phone ?? '').trim() || String(p.phone_primary ?? '').trim();
    const jid = phoneToWhatsAppJid(phoneRaw);
    if (!jid) {
      noPhone += 1;
      continue;
    }
    if (seenJid.has(jid)) {
      duplicatePhone += 1;
      continue;
    }
    seenJid.add(jid);
    eligible += 1;
  }

  return {
    eligible,
    optedOut,
    noPhone,
    emailNotVerified,
    accountNotActive,
    noApprovedChild,
    duplicatePhone,
  };
}
