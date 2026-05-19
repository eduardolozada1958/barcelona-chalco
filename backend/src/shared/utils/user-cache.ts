import type { AuthenticatedUser } from '@shared/types';

const TTL_MS = 45_000;
const MAX_ENTRIES = 300;

type Entry = { user: AuthenticatedUser; expiresAt: number };

const cache = new Map<string, Entry>();

export function getCachedUser(userId: string): AuthenticatedUser | null {
  const entry = cache.get(userId);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(userId);
    return null;
  }
  return entry.user;
}

export function setCachedUser(userId: string, user: AuthenticatedUser): void {
  if (cache.size >= MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(userId, { user, expiresAt: Date.now() + TTL_MS });
}

export function invalidateCachedUser(userId: string): void {
  cache.delete(userId);
}
