const NETWORK_CODES = new Set([
  'ERR_NETWORK',
  'ECONNABORTED',
  'ECONNREFUSED',
  'ETIMEDOUT',
  'ERR_CANCELED',
]);

const GATEWAY_STATUSES = new Set([502, 503, 504]);

/** API unreachable (deploy, timeout, nginx 502) — not an auth or app 4xx/500. */
export function isNetworkError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as { code?: string; response?: { status?: number } };
  if (e.response?.status != null) {
    return GATEWAY_STATUSES.has(e.response.status);
  }
  if (e.code) return NETWORK_CODES.has(e.code);
  return true;
}
