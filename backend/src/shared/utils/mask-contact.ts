export function maskEmail(email: string | null | undefined): string {
  const e = String(email ?? '').trim();
  const at = e.indexOf('@');
  if (at < 2) return '***@***';
  const local = e.slice(0, at);
  const domain = e.slice(at + 1);
  return `${local.slice(0, 2)}***@${domain}`;
}

export function maskPhone(phone: string | null | undefined): string {
  const digits = String(phone ?? '').replace(/\D/g, '');
  if (digits.length < 4) return '****';
  return `****${digits.slice(-4)}`;
}
