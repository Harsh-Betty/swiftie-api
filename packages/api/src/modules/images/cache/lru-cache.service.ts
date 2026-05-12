import { Injectable } from '@nestjs/common';
import { LRUCache } from 'lru-cache';

// lru-cache constrains its value type to NonNullable<unknown>; we only cache
// objects/arrays in this module so `object` is the right base.
@Injectable()
export class LruCacheService {
  private readonly cache = new LRUCache<string, object>({
    max: 1000,
    ttl: 5 * 60_000,
  });

  get<T extends object>(ns: string, key: string): T | undefined {
    return this.cache.get(`${ns}:${key}`) as T | undefined;
  }

  set<T extends object>(ns: string, key: string, value: T, ttlMs?: number): void {
    this.cache.set(`${ns}:${key}`, value, ttlMs ? { ttl: ttlMs } : undefined);
  }
}
