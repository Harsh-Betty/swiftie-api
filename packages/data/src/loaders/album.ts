import { ALBUM_SLUGS } from '../__generated__/album-index';
import {
  type Album,
  AlbumSchema,
  type AlbumType,
  type TaylorsVersionStatus,
} from '../schemas/album';

const cache = new Map<string, Album>();

export interface ListAlbumsFilter {
  era?: string;
  type?: AlbumType;
  taylorsVersion?: TaylorsVersionStatus;
  includeTaylorsVersions?: boolean;
}

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

export async function listAlbums(filter: ListAlbumsFilter = {}): Promise<Album[]> {
  const includeTV = filter.includeTaylorsVersions ?? false;
  const albums = await getAllAlbums();

  const filtered = albums.filter((album) => {
    if (!includeTV && album.type === 'taylors_version') return false;
    if (filter.era !== undefined && album.era !== filter.era) return false;
    if (filter.type !== undefined && album.type !== filter.type) return false;
    if (
      filter.taylorsVersion !== undefined &&
      album.taylorsVersion.status !== filter.taylorsVersion
    ) {
      return false;
    }
    return true;
  });

  return filtered.sort((a, b) => a.releaseDate.localeCompare(b.releaseDate));
}
