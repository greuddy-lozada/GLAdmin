export type NetworkListener = (online: boolean) => void;

function getHealthUrl(): string {
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) {
    return `${process.env.NEXT_PUBLIC_API_URL}/health`;
  }
  return '/api/health';
}

export class NetworkStatus {
  private listeners: Set<NetworkListener> = new Set();
  private pingInterval?: ReturnType<typeof setInterval>;
  private _online: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;

  get isOnline() {
    return this._online;
  }

  onStatusChange(listener: NetworkListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private setOnline(online: boolean) {
    if (this._online === online) return;
    this._online = online;
    this.listeners.forEach(fn => fn(online));
  }

  start() {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => this.setOnline(true));
    window.addEventListener('offline', () => this.setOnline(false));

    this.pingInterval = setInterval(async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        try {
          const res = await fetch(getHealthUrl(), { method: 'HEAD', signal: controller.signal });
          this.setOnline(res.ok);
        } finally {
          clearTimeout(timeout);
        }
      } catch {
        this.setOnline(false);
      }
    }, 30_000);
  }

  stop() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = undefined;
    }
  }
}

export const networkStatus = new NetworkStatus();
