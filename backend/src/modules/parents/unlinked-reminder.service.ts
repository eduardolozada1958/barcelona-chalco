import { env } from '@config/env';
import { supabaseAdmin } from '@config/database';
import { BadRequestError } from '@middlewares/error.middleware';
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
};

function publicAppOrigin(): string {
  const raw = env.APP_PUBLIC_URL ?? env.CORS_ORIGIN.split(',')[0]?.trim() ?? '';
  return raw.replace(/\/$/, '');
}

/** Padres activos sin ninguna solicitud de vínculo padre–jugador. */
export async function listUnlinkedParents(): Promise<UnlinkedParentTarget[]> {
  const { data: users, error } = await supabaseAdmin
    .from('users')
    .select('id, email, full_name, phone, email_verified, status')
    .eq('role', 'parent')
    .eq('status', 'active')
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
  const linkCountByParent = new Map<string, number>();

  if (parentIds.length) {
    const { data: links, error: lErr } = await supabaseAdmin
      .from('parent_players')
      .select('parent_id')
      .in('parent_id', parentIds);
    if (lErr) throw new Error(lErr.message);
    for (const row of links ?? []) {
      const pid = String((row as { parent_id: string }).parent_id);
      linkCountByParent.set(pid, (linkCountByParent.get(pid) ?? 0) + 1);
    }
  }

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
    };
    const parent = parentByUser.get(String(row.id));
    if (!parent) continue;
    const parentId = String(parent.id);
    if ((linkCountByParent.get(parentId) ?? 0) > 0) continue;

    const phoneRaw =
      String(row.phone ?? '').trim() || String(parent.phone_primary ?? '').trim();
    const jid = phoneToWhatsAppJid(phoneRaw);
    const full = String(row.full_name ?? '').trim();
    const parts = full.split(/\s+/).filter(Boolean);

    out.push({
      userId:    String(row.id),
      parentId,
      email:     String(row.email),
      firstName: String(parent.first_name ?? parts[0] ?? 'Padre'),
      lastName:  String(parent.last_name ?? parts.slice(1).join(' ') ?? ''),
      phoneRaw,
      jid,
    });
  }

  return out;
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

export async function remindUnlinkedParents(opts: {
  sendEmail: boolean;
  sendWhatsApp: boolean;
}): Promise<RemindUnlinkedResult> {
  if (!opts.sendEmail && !opts.sendWhatsApp) {
    throw new BadRequestError('Elige al menos correo o WhatsApp');
  }

  const targets = await listUnlinkedParents();
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

  if (opts.sendWhatsApp) {
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

  for (const t of targets) {
    const name = `${t.firstName} ${t.lastName}`.trim() || 'Padre/tutor';

    if (opts.sendEmail) {
      if (!t.email) {
        skippedNoEmail += 1;
      } else {
        try {
          await sendMail({
            to:      t.email,
            subject: 'Vincula a tu hijo — F.C. Barcelona Cupido',
            html: `
              <p>Hola <strong>${name}</strong>,</p>
              <p>Tu cuenta en <strong>F.C. Barcelona Cupido</strong> está activa, pero aún <strong>no has vinculado a tu hijo</strong> con su CURP.</p>
              <p>Entra a tu panel → <strong>Mis jugadores</strong> → solicita el vínculo con la CURP del jugador. El entrenador revisará y aprobará el parentesco.</p>
              <p><a href="${linkUrl}">${linkUrl}</a></p>
              <p>Si ya lo hiciste, ignora este mensaje.</p>
            `,
            text: `Hola ${name}. Vincula a tu hijo con CURP en F.C. Barcelona Cupido: ${linkUrl}`,
          });
          emailsSent += 1;
        } catch (e) {
          emailsFailed += 1;
          logger.warn('Recordatorio sin vínculo: falló correo', { email: t.email, err: e });
        }
      }
    }

    if (opts.sendWhatsApp) {
      if (!t.jid) {
        skippedNoPhone += 1;
      } else {
        const msg =
          `*F.C. Barcelona Cupido*\n\n` +
          `Hola ${name}, tu cuenta está activa pero aún no vinculaste a tu hijo con su CURP.\n\n` +
          `Entra a *Mis jugadores* en tu panel y solicita el vínculo. El entrenador lo revisará.\n\n` +
          `${linkUrl}`;
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

  logger.info('Recordatorio padres sin vínculo CURP', {
    targets: targets.length,
    emailsSent,
    whatsappSent,
  });

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
