import { supabaseAdmin } from '@config/database';
import { phoneToWhatsAppJid } from './phone';

export type WhatsAppRecipient = {
  parentId: string;
  jid: string;
  label: string;
};

/** Padres verificados con opt-in, teléfono y al menos un hijo aprobado. */
export async function listVerifiedParentWhatsAppRecipients(): Promise<WhatsAppRecipient[]> {
  const { data: parents, error } = await supabaseAdmin
    .from('parents')
    .select('id, user_id, first_name, last_name, phone_primary')
    .eq('whatsapp_notify_enabled', true)
    .is('deleted_at', null);

  if (error) throw new Error(error.message);
  if (!parents?.length) return [];

  const userIds = [...new Set(parents.map((p) => String((p as { user_id: string }).user_id)))];
  const { data: users, error: uErr } = await supabaseAdmin
    .from('users')
    .select('id, status, email_verified, role')
    .in('id', userIds)
    .is('deleted_at', null)
    .eq('role', 'parent')
    .eq('status', 'active')
    .eq('email_verified', true);

  if (uErr) throw new Error(uErr.message);
  const validUserIds = new Set((users ?? []).map((u) => String((u as { id: string }).id)));

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

    const jid = phoneToWhatsAppJid(String(r.phone_primary ?? '').trim());
    if (!jid || seenJid.has(jid)) continue;
    seenJid.add(jid);

    out.push({
      parentId: r.id,
      jid,
      label: `${r.first_name ?? ''} ${r.last_name ?? ''}`.trim(),
    });
  }

  return out;
}
