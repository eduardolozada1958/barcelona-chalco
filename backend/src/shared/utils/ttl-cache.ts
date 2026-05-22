type Entry = { exp: number; val: unknown };

const store = new Map<string, Entry>();

export function cacheGet<T>(key: string): T | undefined {
  const e = store.get(key);
  if (!e || Date.now() > e.exp) {
    store.delete(key);
    return undefined;
  }
  return e.val as T;
}

export function cacheSet<T>(key: string, val: T, ttlMs: number): void {
  store.set(key, { exp: Date.now() + ttlMs, val });
}

export function cacheDelete(key: string): void {
  store.delete(key);
}

export function cacheDeletePrefix(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

export async function cacheGetOrSet<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const hit = cacheGet<T>(key);
  if (hit !== undefined) return hit;
  const val = await fn();
  cacheSet(key, val, ttlMs);
  return val;
}
