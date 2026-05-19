/**
 * Plantillas HTML para correos transaccionales.
 *
 * Diseño con tablas (máx. compatibilidad: Gmail, Outlook, iOS Mail, etc.).
 * Paleta del club: azul marino #002366 y dorado #D4AF37.
 */

const CLUB_NAME = 'F.C. Barcelona Cupido';
const CLUB_SITE = 'https://barcelona-chalco.pages.dev';
const CLUB_LOGO = `${CLUB_SITE}/images/logo.webp`;

const COLOR_NAVY   = '#002366';
const COLOR_GOLD   = '#D4AF37';
const COLOR_TEXT   = '#1a1a1a';
const COLOR_MUTED  = '#6b7280';
const COLOR_BORDER = '#e5e7eb';
const COLOR_BG     = '#f5f6f8';

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

type EmailLayoutOptions = {
  preheader: string;
  title:     string;
  bodyHtml:  string;
  footerNote?: string;
};

/** Layout reutilizable para todos los correos del club. */
export function emailLayout(opts: EmailLayoutOptions): string {
  const { preheader, title, bodyHtml, footerNote } = opts;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:${COLOR_BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${COLOR_TEXT};">
  <span style="display:none!important;visibility:hidden;mso-hide:all;font-size:1px;color:${COLOR_BG};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(preheader)}</span>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLOR_BG};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">

          <tr>
            <td style="background:${COLOR_NAVY};padding:24px 32px;text-align:center;">
              <a href="${CLUB_SITE}" style="text-decoration:none;color:#ffffff;display:inline-block;">
                <img src="${CLUB_LOGO}" alt="${escapeHtml(CLUB_NAME)}" width="64" height="64" style="display:block;margin:0 auto 8px;border:0;" />
                <div style="font-size:18px;font-weight:700;letter-spacing:0.5px;color:${COLOR_GOLD};">${escapeHtml(CLUB_NAME)}</div>
              </a>
            </td>
          </tr>

          <tr>
            <td style="padding:32px;">
              ${bodyHtml}
            </td>
          </tr>

          <tr>
            <td style="background:#fafbfc;border-top:1px solid ${COLOR_BORDER};padding:20px 32px;text-align:center;font-size:12px;color:${COLOR_MUTED};line-height:1.5;">
              ${footerNote ? `<p style="margin:0 0 8px;">${footerNote}</p>` : ''}
              <p style="margin:0;">
                ${escapeHtml(CLUB_NAME)} ·
                <a href="${CLUB_SITE}" style="color:${COLOR_MUTED};text-decoration:underline;">${CLUB_SITE.replace(/^https?:\/\//, '')}</a>
              </p>
              <p style="margin:8px 0 0;">Este es un correo automático, por favor no respondas a esta dirección.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

type VerificationEmailOptions = {
  fullName: string;
  link:     string;
  hours:    number;
};

export function buildVerificationEmail(opts: VerificationEmailOptions): { html: string; text: string } {
  const { fullName, link, hours } = opts;
  const safeName = escapeHtml(fullName.trim() || 'padre o tutor');
  const safeLink = escapeHtml(link);

  const bodyHtml = `
    <h1 style="margin:0 0 16px;font-size:22px;color:${COLOR_NAVY};font-weight:700;">Confirma tu correo</h1>
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;">Hola <strong>${safeName}</strong>,</p>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;">
      Gracias por crear tu cuenta en <strong>${escapeHtml(CLUB_NAME)}</strong>.
      Para activarla y recibir avisos del club, confirma tu correo electrónico.
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
      <tr>
        <td align="center" bgcolor="${COLOR_GOLD}" style="border-radius:8px;">
          <a href="${link}"
             style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:${COLOR_NAVY};text-decoration:none;border-radius:8px;letter-spacing:0.3px;">
            Confirmar mi correo
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 8px;font-size:13px;color:${COLOR_MUTED};">El enlace es válido durante <strong>${hours} horas</strong>.</p>
    <p style="margin:0 0 16px;font-size:13px;color:${COLOR_MUTED};">¿El botón no funciona? Copia y pega este enlace en tu navegador:</p>
    <p style="margin:0 0 24px;font-size:12px;word-break:break-all;background:#fafbfc;border:1px solid ${COLOR_BORDER};border-radius:6px;padding:10px 12px;color:${COLOR_TEXT};">
      <a href="${link}" style="color:${COLOR_NAVY};text-decoration:none;">${safeLink}</a>
    </p>

    <hr style="border:none;border-top:1px solid ${COLOR_BORDER};margin:24px 0;" />

    <p style="margin:0;font-size:13px;color:${COLOR_MUTED};line-height:1.5;">
      Si no creaste esta cuenta, ignora este mensaje y nadie podrá usar tu correo.
    </p>
  `;

  const html = emailLayout({
    preheader:  `Confirma tu correo para activar tu cuenta en ${CLUB_NAME}.`,
    title:      `Confirma tu correo — ${CLUB_NAME}`,
    bodyHtml,
    footerNote: 'Recibiste este correo porque alguien (probablemente tú) creó una cuenta con esta dirección.',
  });

  const text =
    `Hola ${fullName.trim() || 'padre o tutor'},\n\n` +
    `Gracias por registrarte en ${CLUB_NAME}.\n` +
    `Confirma tu correo abriendo este enlace (válido ${hours} h):\n\n` +
    `${link}\n\n` +
    `Si no creaste esta cuenta, ignora este mensaje.\n\n` +
    `${CLUB_NAME} — ${CLUB_SITE}`;

  return { html, text };
}
