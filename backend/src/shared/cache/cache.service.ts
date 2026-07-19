import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import Redis from 'ioredis';

interface MemoryEntry {
  value: string;
  expiresAt: number;
}

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private redis: Redis | null = null;
  private readonly memory = new Map<string, MemoryEntry>();

  onModuleInit() {
    const url = process.env.REDIS_URL;
    if (!url) {
      this.logger.log('REDIS_URL not set — using in-memory cache');
      return;
    }
    try {
      this.redis = new Redis(url, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
      });
      this.redis.on('error', (err) => {
        this.logger.warn(`Redis error: ${err.message}`);
      });
      void this.redis.connect().catch((err: unknown) => {
        this.logger.warn(
          `Redis connect failed, falling back to memory: ${err instanceof Error ? err.message : String(err)}`,
        );
        this.redis = null;
      });
    } catch (err) {
      this.logger.warn(
        `Redis init failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      this.redis = null;
    }
  }

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit().catch(() => undefined);
      this.redis = null;
    }
    this.memory.clear();
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      if (this.redis) {
        const raw = await this.redis.get(key);
        if (raw == null) return null;
        return JSON.parse(raw) as T;
      }
      const entry = this.memory.get(key);
      if (!entry) return null;
      if (Date.now() >= entry.expiresAt) {
        this.memory.delete(key);
        return null;
      }
      return JSON.parse(entry.value) as T;
    } catch (err) {
      this.logger.warn(
        `cache get failed (${key}): ${err instanceof Error ? err.message : String(err)}`,
      );
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    try {
      const raw = JSON.stringify(value);
      if (this.redis) {
        await this.redis.set(key, raw, 'EX', ttlSeconds);
        return;
      }
      this.memory.set(key, {
        value: raw,
        expiresAt: Date.now() + ttlSeconds * 1000,
      });
    } catch (err) {
      this.logger.warn(
        `cache set failed (${key}): ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  async del(key: string): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.del(key);
        return;
      }
      this.memory.delete(key);
    } catch (err) {
      this.logger.warn(
        `cache del failed (${key}): ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  /** Deletes keys matching prefix* (memory: exact prefix scan; redis: SCAN). */
  async delByPrefix(prefix: string): Promise<void> {
    try {
      if (this.redis) {
        let cursor = '0';
        do {
          const [next, keys] = await this.redis.scan(
            cursor,
            'MATCH',
            `${prefix}*`,
            'COUNT',
            100,
          );
          cursor = next;
          if (keys.length) await this.redis.del(...keys);
        } while (cursor !== '0');
        return;
      }
      for (const key of this.memory.keys()) {
        if (key.startsWith(prefix)) this.memory.delete(key);
      }
    } catch (err) {
      this.logger.warn(
        `cache delByPrefix failed (${prefix}): ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
