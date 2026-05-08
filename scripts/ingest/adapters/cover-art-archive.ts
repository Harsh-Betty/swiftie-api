import type { Album } from '../../../packages/data/src/schemas';
import type { AdapterContext, DataSourceAdapter } from './adapter';

const CAA_BASE = 'https://coverartarchive.org';

let queueTail: Promise<unknown> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const next = queueTail.then(task);
  queueTail = next.catch(() => undefined);
  return next;
}

export const coverArtArchiveAdapter: DataSourceAdapter = {
  id: 'cover-art-archive',
  displayName: 'Cover Art Archive',
  isAvailable() {
    return true;
  },

  async enrichAlbum(album: Album, ctx: AdapterContext): Promise<Partial<Album>> {
    const mbid = album.musicbrainzReleaseGroupId;
    if (!mbid) {
      ctx.logger.debug({ album: album.slug }, 'cover-art-archive: no MBID, skipping');
      return {};
    }

    return enqueue(async () => {
      const url = `${CAA_BASE}/release-group/${mbid}/front-500`;
      ctx.logger.debug({ url }, 'cover-art-archive HEAD');

      let canonical: string | null = null;
      try {
        const res = await fetch(url, { method: 'HEAD', redirect: 'manual' });
        if (res.status === 307) {
          canonical = res.headers.get('location');
        } else if (res.status === 200) {
          canonical = url;
        } else if (res.status === 404) {
          ctx.logger.debug({ album: album.slug }, 'cover-art-archive: no front cover');
          return {};
        } else {
          ctx.logger.warn(
            { album: album.slug, status: res.status },
            'cover-art-archive: unexpected status',
          );
          return {};
        }
      } catch (err) {
        ctx.logger.warn(
          { err: (err as Error).message, album: album.slug },
          'cover-art-archive HEAD failed',
        );
        return {};
      }

      if (!canonical) return {};

      const partial: Partial<Album> = {
        coverArt: {
          primary: canonical,
          sources: { coverArtArchive: canonical },
        },
      };
      return partial;
    });
  },
};
