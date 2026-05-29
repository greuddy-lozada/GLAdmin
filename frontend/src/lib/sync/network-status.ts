export type NetworkListener = (online: boolean) => void;

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
        const res = await fetch('/api/sync/health', { method: 'HEAD' });
        this.setOnline(res.ok);
      } catch {
        this.setOnline(false);
      }
    }, 30_000);
  }

  stop() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
  }
}

export const networkStatus = new NetworkStatus();
