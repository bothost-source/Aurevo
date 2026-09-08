/**
 * ApiKeyPool
 * ----------
 * A small round-robin credential pool so a single provider (e.g. an MTBP-style
 * movie/TV metadata API, or the YouTube Data API) can be backed by *several*
 * API keys instead of one. Spreading requests across keys means a burst of
 * user traffic hits several independent quota buckets instead of exhausting
 * one key's daily/per-minute limit.
 *
 * IMPORTANT — this still respects each provider's terms:
 * - It does not remove or bypass rate limits, it just distributes load.
 * - A key that comes back 429 (rate limited) or 401/403 (revoked/invalid) is
 *   benched with a cooldown instead of being retried immediately.
 * - This whole module is meant to run on your SERVER, never shipped to the
 *   browser — see services/providers/README in this folder.
 */

export class ApiKeyPool {
  /**
   * @param {string[]} keys - list of API keys/tokens for one provider
   * @param {object} [opts]
   * @param {number} [opts.cooldownMs] - how long to bench a key after a 429
   */
  constructor(keys = [], opts = {}) {
    this.keys = keys.filter(Boolean);
    this.cooldownMs = opts.cooldownMs ?? 60_000;
    this.cursor = 0;
    this.benchedUntil = new Map(); // key -> timestamp
  }

  get size() {
    return this.keys.length;
  }

  _available() {
    const now = Date.now();
    return this.keys.filter((k) => (this.benchedUntil.get(k) ?? 0) <= now);
  }

  /** Get the next usable key, round-robin, skipping benched ones. */
  next() {
    if (this.keys.length === 0) {
      throw new Error("ApiKeyPool: no keys configured for this provider.");
    }
    const available = this._available();
    if (available.length === 0) {
      // Every key is cooling down — surface a clear, typed error so the
      // caller can return a proper 429 to its own client instead of hanging.
      const soonest = Math.min(...this.keys.map((k) => this.benchedUntil.get(k) ?? 0));
      const retryInMs = Math.max(0, soonest - Date.now());
      const err = new Error("All API keys in this pool are currently rate limited.");
      err.code = "POOL_EXHAUSTED";
      err.retryInMs = retryInMs;
      throw err;
    }
    this.cursor = (this.cursor + 1) % available.length;
    return available[this.cursor];
  }

  /** Call after a request using `key` came back 429 - benches it briefly. */
  reportRateLimited(key, retryAfterMs) {
    this.benchedUntil.set(key, Date.now() + (retryAfterMs ?? this.cooldownMs));
  }

  /** Call after a request using `key` came back 401/403 - benches it longer. */
  reportInvalid(key) {
    this.benchedUntil.set(key, Date.now() + 24 * 60 * 60 * 1000);
  }
}

/**
 * fetchWithKeyPool
 * Wraps a fetch-like call with automatic key rotation + retry-with-backoff.
 * `buildRequest(key)` must return { url, init } for the given key.
 */
export async function fetchWithKeyPool(pool, buildRequest, { retries = pool.size } = {}) {
  let lastErr;
  for (let attempt = 0; attempt < Math.max(1, retries); attempt++) {
    const key = pool.next();
    const { url, init } = buildRequest(key);
    try {
      const res = await fetch(url, init);
      if (res.status === 429) {
        const retryAfter = Number(res.headers.get("retry-after")) * 1000 || undefined;
        pool.reportRateLimited(key, retryAfter);
        lastErr = new Error(`Rate limited on key ending …${key.slice(-4)}`);
        continue; // try the next key
      }
      if (res.status === 401 || res.status === 403) {
        pool.reportInvalid(key);
        lastErr = new Error(`Key ending …${key.slice(-4)} was rejected by the provider.`);
        continue;
      }
      return res;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error("fetchWithKeyPool: exhausted retries.");
}
