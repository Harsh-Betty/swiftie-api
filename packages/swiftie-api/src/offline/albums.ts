import { ALBUM_BY_SLUG, ALBUMS } from '../__generated__/meta.js';
import type { Album, AlbumWithSongs } from '../shared/types.js';

export function getAlbum(slug: string): Album {
  const album = ALBUM_BY_SLUG.get(slug);
  if (!album) {
    throw new Error(`Album with slug "${slug}" was not found.`);
  }
  return album;
}

export function getAllAlbums(): Album[] {
  return [...ALBUMS].sort((a, b) => a.releaseDate.localeCompare(b.releaseDate));
}

/**
 * Async: lazy-loads the per-album bundle from `dist/albums/<slug>.js`.
 * The dynamic import string is preserved verbatim by rolldown; at runtime it
 * resolves relative to the bundled `dist/index.js`, matching the subpath
 * entries emitted by tsdown.
 */
export async function getAlbumWithSongs(slug: string): Promise<AlbumWithSongs> {
  if (!ALBUM_BY_SLUG.has(slug)) {
    throw new Error(`Album with slug "${slug}" was not found.`);
  }
  const mod = (await import(`./albums/${slug}.js`)) as { default: AlbumWithSongs };
  return mod.default;
}
