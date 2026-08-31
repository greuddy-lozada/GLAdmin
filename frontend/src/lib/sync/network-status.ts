export type NetworkListener = (online: boolean) => void;

const ONLINE_PING_MS = 10_000;
const OFFLINE_PING_MS = 3_000;
const PING_TIMEOUT_MS = 5_000;
const FAIL_THRESHOLD = 1;

function getHealthUrl(): string {
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) {
    return `${process.env.NEXT_PUBLIC_API_URL}/health`;
  }
  return '/api/health';
}

export class NetworkStatus {
  private listeners: Set<NetworkListener> = new Set();
  private pingTimer?: ReturnType<typeof setTimeout>;
  private _online: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private started = false;
  private failCount = 0;
  private pingInFlight = false;

  private readonly onBrowserOnline = () => {
    void this.pingNow();
  };

  private readonly onBrowserOffline = () => {
    this.failCount = FAIL_THRESHOLD;
    this.setOnline(false);
  };

  get isOnline() {
    return this._online;
  }

  onStatusChange(listener: NetworkListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  setOnline(online: boolean) {
    if (online) this.failCount = 0;
    if (this._online === online) return;
    this._online = online;
    this.listeners.forEach((fn) => fn(online));
    if (this.started) this.schedulePing();
  }

  start() {
    if (typeof window === 'undefined' || this.started) return;
    this.started = true;

    window.addEventListener('online', this.onBrowserOnline);
    window.addEventListener('offline', this.onBrowserOffline);

    void this.pingNow();
  }

  stop() {
    this.started = false;
    if (this.pingTimer) {
      clearTimeout(this.pingTimer);
      this.pingTimer = undefined;
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.onBrowserOnline);
      window.removeEventListener('offline', this.onBrowserOffline);
    }
  }

  async pingNow(): Promise<boolean> {
    if (this.pingInFlight) return this._online;
    this.pingInFlight = true;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), PING_TIMEOUT_MS);
      try {
        const res = await fetch(getHealthUrl(), {
          method: 'HEAD',
          signal: controller.signal,
          cache: 'no-store',
        });
        if (res.ok) {
          this.setOnline(true);
          return true;
        }
        this.notePingFailure();
        return false;
      } finally {
        clearTimeout(timeout);
      }
    } catch {
      this.notePingFailure();
      return false;
    } finally {
      this.pingInFlight = false;
      if (this.started) this.schedulePing();
    }
  }

  private notePingFailure() {
    this.failCount += 1;
    if (this.failCount >= FAIL_THRESHOLD || !this._online) {
      this.setOnline(false);
    }
  }

  private schedulePing() {
    if (!this.started) return;
    if (this.pingTimer) clearTimeout(this.pingTimer);
    const delay = this._online ? ONLINE_PING_MS : OFFLINE_PING_MS;
    this.pingTimer = setTimeout(() => {
      void this.pingNow();
    }, delay);
  }
}

export const networkStatus = new NetworkStatus();
