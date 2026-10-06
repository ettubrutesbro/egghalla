// Polite JSON fetcher: per-host throttle, retries with backoff, timeout.

const MIN_INTERVAL_MS = 1000;
const lastRequestAt = new Map(); // host -> timestamp
const hostQueues = new Map(); // host -> promise chain (serializes per host)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function throttle(host, minInterval) {
  const prev = hostQueues.get(host) ?? Promise.resolve();
  let release;
  const next = new Promise((r) => (release = r));
  hostQueues.set(host, prev.then(() => next));
  await prev;
  const wait = (lastRequestAt.get(host) ?? 0) + minInterval - Date.now();
  if (wait > 0) await sleep(wait);
  lastRequestAt.set(host, Date.now());
  release();
}

export class HttpError extends Error {
  constructor(message, { url, status, body } = {}) {
    super(message);
    this.url = url;
    this.status = status;
    this.body = body;
  }
}

/**
 * fetchJson(url, { headers, method, retries, timeoutMs, minIntervalMs })
 * Returns { data, status, headers } on success; throws HttpError otherwise.
 */
export async function fetchJson(url, opts = {}) {
  const {
    headers = {},
    method = 'GET',
    retries = 3,
    timeoutMs = 30_000,
    minIntervalMs = MIN_INTERVAL_MS,
  } = opts;
  const host = new URL(url).host;
  let lastErr;

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) await sleep(1000 * 2 ** attempt); // 2s, 4s, 8s
    await throttle(host, minIntervalMs);
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeoutMs);
    try {
      const res = await fetch(url, { method, headers, signal: ac.signal });
      const text = await res.text();
      if (!res.ok) {
        lastErr = new HttpError(`HTTP ${res.status} ${res.statusText} for ${url}`, {
          url,
          status: res.status,
          body: text.slice(0, 500),
        });
        // 4xx (except 429) won't improve with retries
        if (res.status >= 400 && res.status < 500 && res.status !== 429) throw lastErr;
        continue;
      }
      try {
        return { data: JSON.parse(text), status: res.status, headers: Object.fromEntries(res.headers) };
      } catch {
        throw new HttpError(`Invalid JSON from ${url} (status ${res.status}): ${text.slice(0, 200)}`, {
          url,
          status: res.status,
          body: text.slice(0, 500),
        });
      }
    } catch (err) {
      if (err instanceof HttpError && err.status && err.status < 500 && err.status !== 429) throw err;
      lastErr =
        err.name === 'AbortError'
          ? new HttpError(`Timeout after ${timeoutMs}ms for ${url}`, { url, status: 'timeout' })
          : err instanceof HttpError
            ? err
            : new HttpError(`Network error for ${url}: ${err.cause?.code ?? err.message}`, { url, status: 'network' });
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr;
}

/** HEAD request with the same throttle; returns { status, headers } and never throws on HTTP status. */
export async function head(url, { headers = {}, timeoutMs = 30_000, minIntervalMs = MIN_INTERVAL_MS } = {}) {
  const host = new URL(url).host;
  await throttle(host, minIntervalMs);
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url, { method: 'HEAD', headers, signal: ac.signal });
    return { status: res.status, headers: Object.fromEntries(res.headers) };
  } catch (err) {
    return { status: err.name === 'AbortError' ? 'timeout' : 'network', error: err.cause?.code ?? err.message };
  } finally {
    clearTimeout(timer);
  }
}

/** GET text (for HTML inspection), same throttle. */
export async function fetchText(url, { headers = {}, timeoutMs = 30_000 } = {}) {
  const host = new URL(url).host;
  await throttle(host, MIN_INTERVAL_MS);
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers, signal: ac.signal });
    return { status: res.status, text: await res.text() };
  } finally {
    clearTimeout(timer);
  }
}
