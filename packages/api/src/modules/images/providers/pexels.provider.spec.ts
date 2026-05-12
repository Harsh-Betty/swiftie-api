import { BadGatewayException } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppConfigService } from '../../../config/config.service';
import { LruCacheService } from '../cache/lru-cache.service';
import { PexelsProvider } from './pexels.provider';

function makeConfig(pexels: { apiKey: string } | null) {
  return { providers: { pexels } } as unknown as AppConfigService;
}

describe('PexelsProvider', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('isAvailable', () => {
    it('is false when PEXELS_API_KEY missing', () => {
      const p = new PexelsProvider(makeConfig(null), new LruCacheService());
      expect(p.isAvailable()).toBe(false);
    });

    it('is true when key present', () => {
      const p = new PexelsProvider(makeConfig({ apiKey: 'k' }), new LruCacheService());
      expect(p.isAvailable()).toBe(true);
    });
  });

  describe('fetch', () => {
    it('maps photographer attribution + large2x url', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          photos: [
            {
              id: 1,
              width: 4000,
              height: 3000,
              url: 'https://www.pexels.com/photo/1/',
              photographer: 'Jane Doe',
              photographer_url: 'https://www.pexels.com/@jane',
              alt: 'A test',
              src: {
                original: 'https://images.pexels.com/photos/1/orig.jpg',
                large2x: 'https://images.pexels.com/photos/1/large2x.jpg',
                medium: 'https://images.pexels.com/photos/1/medium.jpg',
                small: 'https://images.pexels.com/photos/1/small.jpg',
              },
            },
          ],
        }),
        text: async () => '',
        headers: new Headers(),
      });

      const p = new PexelsProvider(makeConfig({ apiKey: 'key' }), new LruCacheService());
      const results = await p.fetch({ query: 'lover taylor swift', limit: 5 });

      expect(results).toHaveLength(1);
      const r = results[0]!;
      expect(r.url).toBe('https://images.pexels.com/photos/1/large2x.jpg');
      expect(r.thumbnailUrl).toBe('https://images.pexels.com/photos/1/medium.jpg');
      expect(r.attribution.author).toBe('Jane Doe');
      expect(r.attribution.authorUrl).toBe('https://www.pexels.com/@jane');
      expect(r.source).toBe('pexels');
    });

    it('surfaces upstream 401 as BadGatewayException (no silent empty result)', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
        text: async () => 'unauthorized',
        headers: new Headers(),
      });

      const p = new PexelsProvider(makeConfig({ apiKey: 'bad' }), new LruCacheService());
      await expect(p.fetch({ query: 'lover taylor swift', limit: 5 })).rejects.toBeInstanceOf(
        BadGatewayException,
      );
    });
  });
});
