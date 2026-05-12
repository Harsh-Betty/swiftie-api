import { BadGatewayException } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppConfigService } from '../../../config/config.service';
import { LruCacheService } from '../cache/lru-cache.service';
import { UnsplashProvider } from './unsplash.provider';

function makeConfig(unsplash: { accessKey: string } | null) {
  return { providers: { unsplash } } as unknown as AppConfigService;
}

describe('UnsplashProvider', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('isAvailable', () => {
    it('is false when UNSPLASH_ACCESS_KEY missing', () => {
      const p = new UnsplashProvider(makeConfig(null), new LruCacheService());
      expect(p.isAvailable()).toBe(false);
    });

    it('is true when key present', () => {
      const p = new UnsplashProvider(makeConfig({ accessKey: 'k' }), new LruCacheService());
      expect(p.isAvailable()).toBe(true);
    });
  });

  describe('fetch', () => {
    it('appends UTM params to attribution links per Unsplash guidelines', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          results: [
            {
              id: 'abc',
              width: 4000,
              height: 3000,
              urls: {
                raw: 'r',
                full: 'f',
                regular: 'https://images.unsplash.com/regular',
                small: 'https://images.unsplash.com/small',
                thumb: 't',
              },
              links: { html: 'https://unsplash.com/photos/abc' },
              user: {
                name: 'Jane Doe',
                username: 'janedoe',
                links: { html: 'https://unsplash.com/@janedoe' },
              },
            },
          ],
        }),
        text: async () => '',
        headers: new Headers(),
      });

      const p = new UnsplashProvider(makeConfig({ accessKey: 'k' }), new LruCacheService());
      const results = await p.fetch({ query: 'lover era', limit: 5 });
      expect(results).toHaveLength(1);
      const r = results[0]!;

      expect(r.url).toBe('https://images.unsplash.com/regular');
      expect(r.attribution.author).toBe('Jane Doe');
      expect(r.attribution.authorUrl).toContain('utm_source=swiftie-api');
      expect(r.attribution.authorUrl).toContain('utm_medium=referral');
      expect(r.sourceUrl).toContain('utm_source=swiftie-api');
    });

    it('surfaces upstream 401 as BadGatewayException (no silent empty result)', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
        text: async () => 'unauthorized',
        headers: new Headers(),
      });

      const p = new UnsplashProvider(makeConfig({ accessKey: 'bad' }), new LruCacheService());
      await expect(p.fetch({ query: 'lover era', limit: 5 })).rejects.toBeInstanceOf(
        BadGatewayException,
      );
    });
  });
});
