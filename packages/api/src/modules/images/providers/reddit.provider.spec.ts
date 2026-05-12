import { BadGatewayException } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppConfigService, RedditCredentials } from '../../../config/config.service';
import { LruCacheService } from '../cache/lru-cache.service';
import { RedditProvider } from './reddit.provider';

function makeConfig(reddit: RedditCredentials | null) {
  return { providers: { reddit } } as unknown as AppConfigService;
}

describe('RedditProvider', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('isAvailable', () => {
    it('is false when any of clientId/clientSecret/userAgent missing', () => {
      const p = new RedditProvider(makeConfig(null), new LruCacheService());
      expect(p.isAvailable()).toBe(false);
    });

    it('is true when all three present', () => {
      const p = new RedditProvider(
        makeConfig({
          clientId: 'id',
          clientSecret: 'secret',
          userAgent: 'swiftie-api',
          subreddits: ['TaylorSwift'],
        }),
        new LruCacheService(),
      );
      expect(p.isAvailable()).toBe(true);
    });
  });

  describe('fetch', () => {
    it('filters posts to image URLs and maps reddit attribution', async () => {
      fetchSpy
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ access_token: 'tok', expires_in: 3600 }),
          text: async () => '',
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            data: {
              children: [
                {
                  data: {
                    url: 'https://i.redd.it/swift.jpg',
                    permalink: '/r/TaylorSwift/comments/abc',
                    author: 'fan1',
                    subreddit: 'TaylorSwift',
                    title: 'Lover era',
                    score: 42,
                    preview: {
                      images: [
                        {
                          source: {
                            url: 'https://preview.redd.it/source.jpg',
                            width: 1200,
                            height: 1200,
                          },
                          resolutions: [
                            { url: 'https://preview.redd.it/640.jpg', width: 640, height: 640 },
                          ],
                        },
                      ],
                    },
                  },
                },
                {
                  data: {
                    url: 'https://reddit.com/not-an-image',
                    permalink: '/r/TaylorSwift/comments/xyz',
                    author: 'fan2',
                    subreddit: 'TaylorSwift',
                    title: 'Text post',
                    score: 0,
                  },
                },
              ],
            },
          }),
          text: async () => '',
          headers: new Headers(),
        });

      const p = new RedditProvider(
        makeConfig({
          clientId: 'id',
          clientSecret: 'secret',
          userAgent: 'swiftie-api/test',
          subreddits: ['TaylorSwift', 'SwiftieMerch'],
        }),
        new LruCacheService(),
      );

      const results = await p.fetch({ query: 'lover era', limit: 5 });

      expect(results).toHaveLength(1);
      const r = results[0]!;
      expect(r.url).toBe('https://i.redd.it/swift.jpg');
      expect(r.thumbnailUrl).toBe('https://preview.redd.it/640.jpg');
      expect(r.attribution.author).toBe('u/fan1');
      expect(r.sourceUrl).toBe('https://reddit.com/r/TaylorSwift/comments/abc');
      expect(r.meta?.subreddit).toBe('TaylorSwift');
    });

    it('surfaces upstream 401 on the listing call as BadGatewayException', async () => {
      fetchSpy
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ access_token: 'tok', expires_in: 3600 }),
          text: async () => '',
          headers: new Headers(),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({}),
          text: async () => 'unauthorized',
          headers: new Headers(),
        });

      const p = new RedditProvider(
        makeConfig({
          clientId: 'id',
          clientSecret: 'secret',
          userAgent: 'swiftie-api/test',
          subreddits: ['TaylorSwift'],
        }),
        new LruCacheService(),
      );

      await expect(p.fetch({ query: 'lover era', limit: 5 })).rejects.toBeInstanceOf(
        BadGatewayException,
      );
    });
  });
});
