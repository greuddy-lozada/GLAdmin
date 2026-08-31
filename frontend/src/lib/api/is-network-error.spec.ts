import { describe, it, expect } from 'vitest';
import { isNetworkError } from './is-network-error';

describe('isNetworkError', () => {
  it('treats axios network codes as unreachable', () => {
    expect(isNetworkError({ code: 'ERR_NETWORK' })).toBe(true);
    expect(isNetworkError({ code: 'ECONNABORTED' })).toBe(true);
    expect(isNetworkError({ code: 'ECONNREFUSED' })).toBe(true);
    expect(isNetworkError({ code: 'ETIMEDOUT' })).toBe(true);
  });

  it('treats gateway statuses as unreachable', () => {
    expect(isNetworkError({ response: { status: 502 } })).toBe(true);
    expect(isNetworkError({ response: { status: 503 } })).toBe(true);
    expect(isNetworkError({ response: { status: 504 } })).toBe(true);
  });

  it('does not treat auth or app errors as unreachable', () => {
    expect(isNetworkError({ response: { status: 401 } })).toBe(false);
    expect(isNetworkError({ response: { status: 403 } })).toBe(false);
    expect(isNetworkError({ response: { status: 500 } })).toBe(false);
    expect(isNetworkError({ response: { status: 404 } })).toBe(false);
  });

  it('treats missing response without a known code as unreachable', () => {
    expect(isNetworkError({ message: 'Network Error' })).toBe(true);
  });

  it('rejects empty values', () => {
    expect(isNetworkError(null)).toBe(false);
    expect(isNetworkError(undefined)).toBe(false);
  });
});
