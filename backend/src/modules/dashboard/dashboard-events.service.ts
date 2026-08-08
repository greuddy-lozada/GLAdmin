import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { EventEmitter } from 'events';
import Redis from 'ioredis';
import { Observable } from 'rxjs';

export type DashboardEventType =
  | 'sale.created'
  | 'stock.low'
  | 'kpi.patch'
  | 'heartbeat';

export interface DashboardEvent {
  type: DashboardEventType;
  payload: unknown;
  at: string;
}

@Injectable()
export class DashboardEventsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DashboardEventsService.name);
  private readonly local = new EventEmitter();
  private publisher: Redis | null = null;
  private subscriber: Redis | null = null;
  private readonly stockDedupe = new Map<string, number>();
  private readonly STOCK_DEDUPE_MS = 5 * 60 * 1000;

  constructor() {
    this.local.setMaxListeners(100);
  }

  onModuleInit() {
    const url = process.env.REDIS_URL;
    if (!url) {
      this.logger.log(
        'REDIS_URL not set — dashboard events use in-process bus',
      );
      return;
    }
    try {
      this.publisher = new Redis(url, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
      });
      this.subscriber = new Redis(url, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
      });
      this.publisher.on('error', (err) => {
        this.logger.warn(`Dashboard Redis publisher: ${err.message}`);
      });
      this.subscriber.on('error', (err) => {
        this.logger.warn(`Dashboard Redis subscriber: ${err.message}`);
      });
      void Promise.all([this.publisher.connect(), this.subscriber.connect()])
        .then(() => {
          this.subscriber!.on('message', (channel, message) => {
            this.fanInFromRedis(channel, message);
          });
        })
        .catch((err: unknown) => {
          this.logger.warn(
            `Dashboard Redis connect failed — in-process only: ${err instanceof Error ? err.message : String(err)}`,
          );
          void this.publisher?.quit().catch(() => undefined);
          void this.subscriber?.quit().catch(() => undefined);
          this.publisher = null;
          this.subscriber = null;
        });
    } catch (err) {
      this.logger.warn(
        `Dashboard Redis init failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      this.publisher = null;
      this.subscriber = null;
    }
  }

  async onModuleDestroy() {
    await this.publisher?.quit().catch(() => undefined);
    await this.subscriber?.quit().catch(() => undefined);
    this.publisher = null;
    this.subscriber = null;
    this.local.removeAllListeners();
  }

  channel(orgId: string): string {
    return `dashboard:${orgId}`;
  }

  /** Fail-open: never throws to callers. */
  publish(orgId: string, type: DashboardEventType, payload: unknown): void {
    if (type === 'stock.low') {
      const productId =
        payload && typeof payload === 'object' && 'id' in payload
          ? String((payload as { id: string }).id)
          : null;
      if (productId && !this.shouldEmitStock(orgId, productId)) return;
    }

    const event: DashboardEvent = {
      type,
      payload,
      at: new Date().toISOString(),
    };

    try {
      this.local.emit(this.channel(orgId), event);
    } catch (err) {
      this.logger.warn(
        `Local emit failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    if (this.publisher) {
      void this.publisher
        .publish(this.channel(orgId), JSON.stringify(event))
        .catch((err: unknown) => {
          this.logger.warn(
            `Redis publish failed: ${err instanceof Error ? err.message : String(err)}`,
          );
        });
    }
  }

  observe(orgId: string): Observable<{ type: string; data: unknown }> {
    const channel = this.channel(orgId);
    return new Observable((subscriber) => {
      const onEvent = (event: DashboardEvent) => {
        subscriber.next({ type: event.type, data: event });
      };

      this.local.on(channel, onEvent);

      let subscribed = false;
      if (this.subscriber) {
        void this.subscriber
          .subscribe(channel)
          .then(() => {
            subscribed = true;
          })
          .catch((err: unknown) => {
            this.logger.warn(
              `Redis subscribe failed: ${err instanceof Error ? err.message : String(err)}`,
            );
          });
      }

      const heartbeat = setInterval(() => {
        subscriber.next({
          type: 'heartbeat',
          data: {
            type: 'heartbeat',
            payload: { at: new Date().toISOString() },
            at: new Date().toISOString(),
          },
        });
      }, 15_000);

      return () => {
        clearInterval(heartbeat);
        this.local.off(channel, onEvent);
        if (subscribed && this.subscriber) {
          void this.subscriber.unsubscribe(channel).catch(() => undefined);
        }
      };
    });
  }

  private fanInFromRedis(channel: string, message: string) {
    try {
      const event = JSON.parse(message) as DashboardEvent;
      // Avoid double-delivery on the publishing process: local already emitted.
      // Other nodes only get Redis. Same node: skip re-emit if we originated.
      // Simple approach: tag with pid — for v1, skip fan-in on publisher node by
      // only using Redis for cross-process; local listeners already got the event.
      // So: if we have publisher, Redis messages on same process would duplicate.
      // Fix: don't local-emit when redis publish succeeds? Then single-node without
      // subscriber wouldn't work. Better: fan-in only when message comes from Redis
      // AND use a skip for same-process via `origin` field.
      if (event && typeof event === 'object' && event.type) {
        // Re-emit only for subscribers that didn't get local — same process already
        // received local.emit. Cross-process: no local.emit happened here.
        // On publishing node, Redis echoes to subscriber → would duplicate.
        // Mark origin:
        if (
          (event as DashboardEvent & { origin?: string }).origin ===
          this.originId
        ) {
          return;
        }
        this.local.emit(channel, event);
      }
    } catch (err) {
      this.logger.warn(
        `Bad dashboard Redis message: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  private readonly originId = `pid-${process.pid}-${Math.random().toString(36).slice(2, 8)}`;

  /** Override publish to stamp origin for Redis echo suppression. */
  publishWithOrigin(
    orgId: string,
    type: DashboardEventType,
    payload: unknown,
  ): void {
    if (type === 'stock.low') {
      const productId =
        payload && typeof payload === 'object' && 'id' in payload
          ? String((payload as { id: string }).id)
          : null;
      if (productId && !this.shouldEmitStock(orgId, productId)) return;
    }

    const event: DashboardEvent & { origin: string } = {
      type,
      payload,
      at: new Date().toISOString(),
      origin: this.originId,
    };

    try {
      this.local.emit(this.channel(orgId), event);
    } catch (err) {
      this.logger.warn(
        `Local emit failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    if (this.publisher) {
      void this.publisher
        .publish(this.channel(orgId), JSON.stringify(event))
        .catch((err: unknown) => {
          this.logger.warn(
            `Redis publish failed: ${err instanceof Error ? err.message : String(err)}`,
          );
        });
    }
  }

  private shouldEmitStock(orgId: string, productId: string): boolean {
    const key = `${orgId}:${productId}`;
    const now = Date.now();
    const last = this.stockDedupe.get(key);
    if (last && now - last < this.STOCK_DEDUPE_MS) return false;
    this.stockDedupe.set(key, now);
    return true;
  }
}
