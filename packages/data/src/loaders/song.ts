import * as z from 'zod';
import { ALBUM_SLUGS } from '../__generated__/album-index';
import { type Song, SongSchema } from '../schemas/song';
import { getAllAlbums } from './album';

const albumSongsCache = new Map<string, Song[]>();
let songSlugIndex: Map<string, string> | null = null;

const SongArraySchema = z.array(SongSchema);

export interface ListSongsFilter {
  albumSlug?: string;
  isVaultTrack?: boolean;
  isBonusTrack?: boolean;
  feature?: string;
  includeTaylorsVersions?: boolean;
}

function isCommentEntry(entry: unknown): boolean {
  return typeof entry === 'object' && entry !== null && '_comment' in entry;
}

export async function getSongsByAlbum(albumSlug: string): Promise<Song[]> {
  const cached = albumSongsCache.get(albumSlug);
  if (cached) return cached;

  // Path is relative to the bundled output (dist/index.{mjs,cjs}), not the source.
  const mod = (await import(`./data/songs/${albumSlug}.json`, {
    with: { type: 'json' },
  })) as { default: unknown };
  const raw = Array.isArray(mod.default) ? mod.default : [];
  const cleaned = raw.filter((entry) => !isCommentEntry(entry));
  const songs = SongArraySchema.parse(cleaned);
  albumSongsCache.set(albumSlug, songs);
  return songs;
}

async function buildSongSlugIndex(): Promise<Map<string, string>> {
  if (songSlugIndex) return songSlugIndex;
  const index = new Map<string, string>();
  await Promise.all(
    ALBUM_SLUGS.map(async (albumSlug) => {
      const songs = await getSongsByAlbum(albumSlug);
      for (const song of songs) {
        index.set(song.slug, albumSlug);
      }
    }),
  );
  songSlugIndex = index;
  return index;
}

export async function getSong(slug: string): Promise<Song> {
  const index = await buildSongSlugIndex();
  const albumSlug = index.get(slug);
  if (!albumSlug) {
    throw new Error(`Song with slug "${slug}" was not found in any album.`);
  }
  const songs = await getSongsByAlbum(albumSlug);
  const song = songs.find((s) => s.slug === slug);
  if (!song) {
    throw new Error(
      `Song with slug "${slug}" indexed under album "${albumSlug}" but not present after parse.`,
    );
  }
  return song;
}

export async function getAllSongs(): Promise<Song[]> {
  const lists = await Promise.all(ALBUM_SLUGS.map((slug) => getSongsByAlbum(slug)));
  return lists.flat();
}

export async function listSongs(filter: ListSongsFilter = {}): Promise<Song[]> {
  const includeTV = filter.includeTaylorsVersions ?? false;
  const featureNeedle = filter.feature?.trim().toLowerCase();

  let tvAlbumSlugs: Set<string> | null = null;
  if (!includeTV) {
    const albums = await getAllAlbums();
    tvAlbumSlugs = new Set(albums.filter((a) => a.type === 'taylors_version').map((a) => a.slug));
  }

  const songs = filter.albumSlug ? await getSongsByAlbum(filter.albumSlug) : await getAllSongs();

  return songs.filter((song) => {
    if (tvAlbumSlugs?.has(song.albumSlug)) return false;
    if (filter.isVaultTrack !== undefined && song.isVaultTrack !== filter.isVaultTrack) {
      return false;
    }
    if (filter.isBonusTrack !== undefined && song.isBonusTrack !== filter.isBonusTrack) {
      return false;
    }
    if (featureNeedle) {
      const hasFeature = song.features.some((f) => f.toLowerCase().includes(featureNeedle));
      if (!hasFeature) return false;
    }
    return true;
  });
}
