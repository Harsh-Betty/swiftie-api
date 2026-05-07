import { ALBUM_SLUGS } from '../__generated__/album-index';
import { type Album, AlbumSchema } from '../schemas/album';

const cache = new Map<string, Album>();

export async function getAlbum(slug: string): Promise<Album> {
  const cached = cache.get(slug);
  if (cached) return cached;

  // Path is relative to the bundled output (dist/index.{mjs,cjs}), not the source.
  // Rolldown preserves dynamic-concat import paths verbatim; the JSON files are
  // copied to dist/data by the build:done hook.
  const mod = (await import(`./data/albums/${slug}.json`, {
    with: { type: 'json' },
  })) as { default: unknown };
  const album = AlbumSchema.parse(mod.default);
  cache.set(slug, album);
  return album;
}

export async function getAllAlbums(): Promise<Album[]> {
  return Promise.all(ALBUM_SLUGS.map((slug) => getAlbum(slug)));
}

export async function getCanonicalAlbums(): Promise<Album[]> {
  const albums = await getAllAlbums();
  return albums.filter((album) => album.type !== 'taylors_version');
}
