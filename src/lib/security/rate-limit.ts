// A small fixed window rate limiter kept in memory. The site runs as one container, so a
// per process count is enough for the few routes that need it (for example
// /api/revalidate). It is a brake against guessing and floods, not a billing control.

export type RateLimiter = (key: string, now?: number) => boolean;

/**
 * Allows `limit` calls per `windowMs` for each key; returns false once a key is over.
 * It remembers at most `maxKeys` keys, so a caller that keeps changing its key cannot make it
 * grow without limit: expired windows go first, then the oldest.
 */
export function createRateLimiter(limit: number, windowMs: number, maxKeys = 10_000): RateLimiter {
  const windows = new Map<string, { start: number; count: number }>();
  return (key, now = Date.now()) => {
    const window = windows.get(key);
    if (window && now - window.start < windowMs) {
      window.count += 1;
      return window.count <= limit;
    }
    windows.delete(key);
    if (windows.size >= maxKeys) {
      for (const [name, old] of windows) {
        if (now - old.start >= windowMs) windows.delete(name);
      }
      // Map keeps insertion order, so the first key is the oldest window.
      while (windows.size >= maxKeys) windows.delete(windows.keys().next().value as string);
    }
    windows.set(key, { start: now, count: 1 });
    return true;
  };
}
