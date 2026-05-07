import * as z from 'zod';
import { ALBUM_SLUGS } from '../__generated__/album-index';
import { type Song, SongSchema } from '../schemas/song';

const albumSongsCache = new Map<string, Song[]>();
let songSlugIndex: Map<string, string> | null = null;

const SongArraySchema = z.array(SongSchema);

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
