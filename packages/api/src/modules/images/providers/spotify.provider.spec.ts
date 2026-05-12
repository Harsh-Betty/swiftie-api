import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppConfigService } from '../../../config/config.service';
import { LruCacheService } from '../cache/lru-cache.service';
import { SpotifyProvider } from './spotify.provider';

function makeConfig(spotify: { clientId: string; clientSecret: string } | null) {
  return { providers: { spotify } } as unknown as AppConfigService;
}

describe('SpotifyProvider', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('isAvailable', () => {
    it('is false when credentials missing', () => {
      const p = new SpotifyProvider(makeConfig(null), new LruCacheService());
      expect(p.isAvailable()).toBe(false);
    });

    it('is true when both credentials present', () => {
      const p = new SpotifyProvider(
        makeConfig({ clientId: 'id', clientSecret: 'secret' }),
        new LruCacheService(),
      );
      expect(p.isAvailable()).toBe(true);
    });
  });

  describe('fetch', () => {
    it('looks up album by spotifyId and maps images sorted desc', async () => {
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
            id: 'spotify-album-id',
            name: 'Lover',
            images: [
              { url: 'https://i.scdn.co/image/small.jpg', width: 300, height: 300 },
              { url: 'https://i.scdn.co/image/large.jpg', width: 640, height: 640 },
            ],
            external_urls: { spotify: 'https://open.spotify.com/album/spotify-album-id' },
          }),
          text: async () => '',
        });

      const p = new SpotifyProvider(
        makeConfig({ clientId: 'id', clientSecret: 'secret' }),
        new LruCacheService(),
      );

      const results = await p.fetch({
        album: { slug: 'lover', title: 'Lover', spotifyId: 'spotify-album-id' },
        limit: 5,
      });

      expect(results).toHaveLength(2);
      const first = results[0]!;
      expect(first.url).toBe('https://i.scdn.co/image/large.jpg');
      expect(first.width).toBe(640);
      expect(first.source).toBe('spotify');
      expect(first.meta?.spotifyUri).toBe('spotify:album:spotify-album-id');
    });
  });
});
