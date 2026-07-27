export interface ApiErrorShape {
  code?: string;
  message?: string;
  details?: string[];
}

export function extractApiError(err: unknown): string | null {
  if (!err || typeof err !== 'object') return null;
  const data = (err as { response?: { data?: { error?: ApiErrorShape } } })?.response?.data?.error;
  return data?.message ?? null;
}

export function extractApiErrorCode(err: unknown): string | null {
  if (!err || typeof err !== 'object') return null;
  const data = (err as { response?: { data?: { error?: ApiErrorShape } } })?.response?.data?.error;
  return data?.code ?? null;
}
