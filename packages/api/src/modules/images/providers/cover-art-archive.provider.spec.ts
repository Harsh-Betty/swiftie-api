import { describe, expect, it } from 'vitest';
import { CoverArtArchiveProvider } from './cover-art-archive.provider';

const ctxWithMbid = {
  album: {
    slug: 'lover',
    title: 'Lover',
    mbid: 'a05e7df3-0000-4000-8000-000000000000',
  },
  limit: 10,
};

const ctxWithoutMbid = {
  album: { slug: 'lover', title: 'Lover' },
  limit: 10,
};

describe('CoverArtArchiveProvider', () => {
  const provider = new CoverArtArchiveProvider();

  describe('isAvailable', () => {
    it('is always available (no credentials required)', () => {
      expect(provider.isAvailable()).toBe(true);
    });
  });

  describe('fetch', () => {
    it('returns [] when album has no MBID', async () => {
      const results = await provider.fetch(ctxWithoutMbid);
      expect(results).toEqual([]);
    });

    it('returns a 1200px and 500px URL pair for a known MBID', async () => {
      const results = await provider.fetch(ctxWithMbid);
      expect(results).toHaveLength(1);
      const img = results[0]!;
      expect(img.url).toBe(
        'https://coverartarchive.org/release-group/a05e7df3-0000-4000-8000-000000000000/front-1200',
      );
      expect(img.thumbnailUrl).toBe(
        'https://coverartarchive.org/release-group/a05e7df3-0000-4000-8000-000000000000/front-500',
      );
      expect(img.width).toBe(1200);
      expect(img.source).toBe('cover-art-archive');
      expect(img.attribution.licenseUrl).toBe('https://musicbrainz.org/doc/Cover_Art_Archive');
    });
  });
});
