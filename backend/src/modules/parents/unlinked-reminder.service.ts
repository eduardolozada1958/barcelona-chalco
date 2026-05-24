import { env } from '@config/env';
import { supabaseAdmin } from '@config/database';
import { BadRequestError, NotFoundError } from '@middlewares/error.middleware';
import { isEmailConfigured, sendMail } from '@shared/services/email.service';
import { logger } from '@shared/utils/logger';
import { phoneToWhatsAppJid } from '@modules/whatsapp/phone';
import { sendWhatsAppText, getWhatsAppStatus } from '@modules/whatsapp/whatsapp.client';

export type UnlinkedParentTarget = {
  userId: string;
  parentId: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneRaw: string;
  jid: string | null;
  status: string;
  emailVerified: boolean;
};

function publicAppOrigin(): string {
  const raw = env.APP_PUBLIC_URL ?? env.CORS_ORIGIN.split(',')[0]?.trim() ?? '';
  return raw.replace(/\/$/, '');
}

function displayName(first: string, last: string): string {
  return `${first} ${last}`.trim() || 'Padre/tutor';
}

/** Un solo mensaje WA (sin URL suelta al final → evita burbuja extra de vista previa). */
export function buildCurpReminderWhatsAppText(name: string, linkUrl: string): string {
  return (
    `*F.C. Barcelona Cupido*\n\n` +
    `Hola ${name}, aún no vinculaste a tu hijo con su CURP. ` +
    `Entra a *Mis jugadores* en tu panel (${linkUrl}) y solicita el vínculo; el entrenador lo revisará.`
  );
}

function buildCurpReminderEmail(name: string, linkUrl: string) {
  return {
    subject: 'Vincula a tu hijo — F.C. Barcelona Cupido',
    html: `
      <p>Hola <strong>${name}</strong>,</p>
      <p>Tu cuenta en <strong>F.C. Barcelona Cupido</strong> está activa, pero aún <strong>no has vinculado a tu hijo</strong> con su CURP.</p>
      <p>Entra a tu panel → <strong>Mis jugadores</strong> → solicita el vínculo con la CURP del jugador. El entrenador revisará y aprobará el parentesco.</p>
      <p><a href="${linkUrl}">${linkUrl}</a></p>
      <p>Si ya lo hiciste, ignora este mensaje.</p>
    `,
    text: `Hola ${name}. Vincula a tu hijo con CURP en F.C. Barcelona Cupido: ${linkUrl}`,
  };
}

async function loadParentLinkCounts(parentIds: string[]): Promise<Map<string, number>> {
  const linkCountByParent = new Map<string, number>();
  if (!parentIds.length) return linkCountByParent;

  const { data: links, error: lErr } = await supabaseAdmin
    .from('parent_players')
    .select('parent_id')
    .in('parent_id', parentIds);
  if (lErr) throw new Error(lErr.message);
  for (const row of links ?? []) {
    const pid = String((row as { parent_id: string }).parent_id);
    linkCountByParent.set(pid, (linkCountByParent.get(pid) ?? 0) + 1);
  }
  return linkCountByParent;
}

function mapUserToTarget(
  row: {
    id: string;
    email: string;
    full_name?: string | null;
    phone?: string | null;
    email_verified?: boolean;
    status: string;
  },
  parent: Record<string, unknown>,
): UnlinkedParentTarget {
  const phoneRaw =
    String(row.phone ?? '').trim() || String(parent.phone_primary ?? '').trim();
  const full = String(row.full_name ?? '').trim();
  const parts = full.split(/\s+/).filter(Boolean);

  return {
    userId:        String(row.id),
    parentId:      String(parent.id),
    email:         String(row.email),
    firstName:     String(parent.first_name ?? parts[0] ?? 'Padre'),
    lastName:      String(parent.last_name ?? parts.slice(1).join(' ') ?? ''),
    phoneRaw,
    jid:           phoneToWhatsAppJid(phoneRaw),
    status:        String(row.status),
    emailVerified: Boolean(row.email_verified),
  };
}

/** Padres sin solicitud de vínculo (activos o pendientes de verificar correo). */
export async function listUnlinkedParents(): Promise<UnlinkedParentTarget[]> {
  const { data: users, error } = await supabaseAdmin
    .from('users')
    .select('id, email, full_name, phone, email_verified, status')
    .eq('role', 'parent')
    .in('status', ['active', 'pending'])
    .is('deleted_at', null);

  if (error) throw new Error(error.message);
  if (!users?.length) return [];

  const userIds = users.map((u) => String((u as { id: string }).id));
  const { data: parents, error: pErr } = await supabaseAdmin
    .from('parents')
    .select('id, user_id, first_name, last_name, phone_primary')
    .in('user_id', userIds)
    .is('deleted_at', null);

  if (pErr) throw new Error(pErr.message);

  const parentIds = (parents ?? []).map((p) => String((p as { id: string }).id));
  const linkCountByParent = await loadParentLinkCounts(parentIds);

  const parentByUser = new Map(
    (parents ?? []).map((p) => [String((p as { user_id: string }).user_id), p as Record<string, unknown>]),
  );

  const out: UnlinkedParentTarget[] = [];
  for (const u of users) {
    const row = u as {
      id: string;
      email: string;
      full_name?: string | null;
      phone?: string | null;
      email_verified?: boolean;
      status: string;
    };
    const parent = parentByUser.get(String(row.id));
    if (!parent) continue;
    const parentId = String(parent.id);
    if ((linkCountByParent.get(parentId) ?? 0) > 0) continue;

    out.push(mapUserToTarget(row, parent));
  }

  return out;
}

export async function getUnlinkedParentTarget(userId: string): Promise<UnlinkedParentTarget | null> {
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('id, email, full_name, phone, email_verified, status, role')
    .eq('id', userId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!user || user.role !== 'parent') return null;
  if (user.status !== 'active' && user.status !== 'pending') return null;

  const { data: parent, error: pErr } = await supabaseAdmin
    .from('parents')
    .select('id, user_id, first_name, last_name, phone_primary')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .maybeSingle();

  if (pErr) throw new Error(pErr.message);
  if (!parent) return null;

  const linkCountByParent = await loadParentLinkCounts([String(parent.id)]);
  if ((linkCountByParent.get(String(parent.id)) ?? 0) > 0) return null;

  return mapUserToTarget(user as Parameters<typeof mapUserToTarget>[0], parent as Record<string, unknown>);
}

function assertWhatsAppReady(): void {
  if (!env.WHATSAPP_ENABLED) {
    throw new BadRequestError('WhatsApp no está habilitado en el servidor.');
  }
  const { state } = getWhatsAppStatus();
  if (state !== 'open') {
    throw new BadRequestError(
      'WhatsApp no está conectado. Abre el panel de administración y escanea el QR antes de enviar.',
    );
  }
}

function canSendEmailReminder(t: UnlinkedParentTarget): boolean {
  return Boolean(t.email) && t.status === 'active' && t.emailVerified;
}

function canSendWhatsAppReminder(t: UnlinkedParentTarget): boolean {
  return Boolean(t.jid) && (t.status === 'active' || t.status === 'pending');
}

export type RemindUnlinkedResult = {
  targets: number;
  emailsSent: number;
  emailsFailed: number;
  whatsappSent: number;
  whatsappFailed: number;
  skippedNoEmail: number;
  skippedNoPhone: number;
};

async function sendRemindersToTargets(
  targets: UnlinkedParentTarget[],
  opts: { sendEmail: boolean; sendWhatsApp: boolean },
): Promise<RemindUnlinkedResult> {
  if (!opts.sendEmail && !opts.sendWhatsApp) {
    throw new BadRequestError('Elige al menos correo o WhatsApp');
  }

  const origin = publicAppOrigin();
  const linkUrl = origin ? `${origin}/dashboard/mis-jugadores` : '/dashboard/mis-jugadores';

  let emailsSent = 0;
  let emailsFailed = 0;
  let whatsappSent = 0;
  let whatsappFailed = 0;
  let skippedNoEmail = 0;
  let skippedNoPhone = 0;

  if (opts.sendEmail && !isEmailConfigured()) {
    throw new BadRequestError('Correo no configurado en el servidor (Brevo/SMTP).');
  }
  if (opts.sendWhatsApp) assertWhatsAppReady();

  const seenJids = new Set<string>();

  for (const t of targets) {
    const name = displayName(t.firstName, t.lastName);

    if (opts.sendEmail) {
      if (!canSendEmailReminder(t)) {
        skippedNoEmail += 1;
      } else {
        try {
          const mail = buildCurpReminderEmail(name, linkUrl);
          await sendMail({ to: t.email, ...mail });
          emailsSent += 1;
        } catch (e) {
          emailsFailed += 1;
          logger.warn('Recordatorio sin vínculo: falló correo', { email: t.email, err: e });
        }
      }
    }

    if (opts.sendWhatsApp) {
      if (!canSendWhatsAppReminder(t) || !t.jid) {
        skippedNoPhone += 1;
      } else if (seenJids.has(t.jid)) {
        logger.warn('Recordatorio sin vínculo: teléfono duplicado omitido', { jid: t.jid, userId: t.userId });
      } else {
        seenJids.add(t.jid);
        const msg = buildCurpReminderWhatsAppText(name, linkUrl);
        try {
          await sendWhatsAppText(t.jid, msg, t.phoneRaw, { lenientVerify: true });
          whatsappSent += 1;
          await new Promise((r) => setTimeout(r, env.WHATSAPP_SEND_DELAY_MS));
        } catch (e) {
          whatsappFailed += 1;
          logger.warn('Recordatorio sin vínculo: falló WhatsApp', { jid: t.jid, err: e });
        }
      }
    }
  }

  return {
    targets: targets.length,
    emailsSent,
    emailsFailed,
    whatsappSent,
    whatsappFailed,
    skippedNoEmail,
    skippedNoPhone,
  };
}

export async function remindUnlinkedParents(opts: {
  sendEmail: boolean;
  sendWhatsApp: boolean;
}): Promise<RemindUnlinkedResult> {
  const targets = await listUnlinkedParents();
  const result = await sendRemindersToTargets(targets, opts);

  logger.info('Recordatorio padres sin vínculo CURP', {
    targets: targets.length,
    emailsSent: result.emailsSent,
    whatsappSent: result.whatsappSent,
  });

  return result;
}

/** Recordatorio a un solo padre (incluye pendientes de verificar correo → WhatsApp). */
export async function remindSingleParent(
  userId: string,
  opts: { sendEmail: boolean; sendWhatsApp: boolean },
): Promise<RemindUnlinkedResult> {
  const target = await getUnlinkedParentTarget(userId);
  if (!target) {
    throw new NotFoundError(
      'No se puede enviar: el usuario no es padre sin vínculo CURP, ya tiene hijo vinculado o está inactivo.',
    );
  }

  const result = await sendRemindersToTargets([target], opts);

  logger.info('Recordatorio individual padre sin vínculo CURP', {
    userId,
    emailsSent: result.emailsSent,
    whatsappSent: result.whatsappSent,
  });

  return result;
}

export async function unlinkedParentsStats(): Promise<{
  count: number;
  withEmail: number;
  withPhone: number;
  pendingEmail: number;
}> {
  const targets = await listUnlinkedParents();
  return {
    count:         targets.length,
    withEmail:     targets.filter((t) => canSendEmailReminder(t)).length,
    withPhone:     targets.filter((t) => canSendWhatsAppReminder(t)).length,
    pendingEmail:  targets.filter((t) => t.status === 'pending' || !t.emailVerified).length,
  };
}
