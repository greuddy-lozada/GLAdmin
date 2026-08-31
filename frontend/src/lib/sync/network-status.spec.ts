import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NetworkStatus } from './network-status';

describe('NetworkStatus', () => {
  let status: NetworkStatus;

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    status = new NetworkStatus();
  });

  afterEach(() => {
    status.stop();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('notifies listeners only when the value changes', () => {
    const fn = vi.fn();
    status.onStatusChange(fn);
    status.setOnline(false);
    status.setOnline(false);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(false);
    status.setOnline(true);
    expect(fn).toHaveBeenCalledWith(true);
  });

  it('marks API down after a failed health ping', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('ECONNREFUSED'));
    status.setOnline(true);
    await status.pingNow();
    expect(status.isOnline).toBe(false);
  });

  it('marks API up after a successful health ping', async () => {
    status.setOnline(false);
    vi.mocked(fetch).mockResolvedValue({ ok: true } as Response);
    await status.pingNow();
    expect(status.isOnline).toBe(true);
  });

  it('does not treat browser online as API up', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false } as Response);
    status.setOnline(true);
    status.start();
    await vi.waitFor(() => expect(status.isOnline).toBe(false));
    window.dispatchEvent(new Event('online'));
    await Promise.resolve();
    expect(status.isOnline).toBe(false);
  });

  it('treats browser offline as API down immediately', () => {
    status.setOnline(true);
    status.start();
    window.dispatchEvent(new Event('offline'));
    expect(status.isOnline).toBe(false);
  });
});
