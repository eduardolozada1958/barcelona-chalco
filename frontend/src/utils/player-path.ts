const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isPlayerUuid(ref: string): boolean {
  return UUID_RE.test(ref);
}

/** Ruta pública del perfil: prefiere slug; fallback UUID. */
export function playerPublicPath(player: { id: string; slug?: string | null }): string {
  const slug = player.slug?.trim();
  if (slug) return `/jugadores/${slug}`;
  return `/jugadores/${player.id}`;
}
