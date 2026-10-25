// A small fixed window rate limiter kept in memory. The site runs as one container, so a
// per process count is enough for the few routes that need it (for example
// /api/revalidate). It is a brake against guessing and floods, not a billing control.

export type RateLimiter = (key: string, now?: number) => boolean;

/** Allows `limit` calls per `windowMs` for each key; returns false once a key is over. */
export function createRateLimiter(limit: number, windowMs: number): RateLimiter {
  const windows = new Map<string, { start: number; count: number }>();
  return (key, now = Date.now()) => {
    // Forget windows that have ended, so the map cannot grow without bound.
    for (const [name, window] of windows) {
      if (now - window.start >= windowMs) windows.delete(name);
    }
    const window = windows.get(key);
    if (!window) {
      windows.set(key, { start: now, count: 1 });
      return true;
    }
    window.count += 1;
    return window.count <= limit;
  };
}
