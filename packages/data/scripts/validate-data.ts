import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as z from 'zod';
import { AlbumSchema, EraSchema, QuoteSchema, type Song, SongSchema } from '../src/schemas';

const here = dirname(fileURLToPath(import.meta.url));
const packageRoot = join(here, '..');
const dataRoot = join(packageRoot, 'src/data');
const albumsDir = join(dataRoot, 'albums');
const songsDir = join(dataRoot, 'songs');
const erasPath = join(dataRoot, 'eras.json');
const quotesPath = join(dataRoot, 'quotes.json');

const SongArraySchema = z.array(SongSchema);
const EraArraySchema = z.array(EraSchema);
const QuoteArraySchema = z.array(QuoteSchema);

const errors: string[] = [];

function fail(message: string): void {
  errors.push(message);
}

function assertUnique(values: readonly string[], label: string): void {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) {
      fail(`${label} "${value}" is duplicated.`);
    }
    seen.add(value);
  }
}

function assertKnown(value: string, known: ReadonlySet<string>, label: string): void {
  if (!known.has(value)) {
    fail(`${label} references unknown slug "${value}".`);
  }
}

function isCommentEntry(entry: unknown): boolean {
  return typeof entry === 'object' && entry !== null && '_comment' in entry;
}

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, 'utf8')) as unknown;
}

async function readAlbums() {
  const entries = (await readdir(albumsDir)).filter((entry) => entry.endsWith('.json')).sort();
  return Promise.all(
    entries.map(async (entry) => AlbumSchema.parse(await readJson(join(albumsDir, entry)))),
  );
}

async function readSongs(albumSlug: string): Promise<Song[]> {
  const raw = await readJson(join(songsDir, `${albumSlug}.json`));
  if (!Array.isArray(raw)) {
    throw new Error(`Songs file for ${albumSlug} is not a JSON array.`);
  }
  return SongArraySchema.parse(raw.filter((entry) => !isCommentEntry(entry)));
}

async function main(): Promise<void> {
  const [albums, eras, quotes] = await Promise.all([
    readAlbums(),
    readJson(erasPath).then((raw) => EraArraySchema.parse(raw)),
    readJson(quotesPath).then((raw) => QuoteArraySchema.parse(raw)),
  ]);

  const albumSlugs = albums.map((album) => album.slug);
  const albumSlugSet = new Set(albumSlugs);
  assertUnique(albumSlugs, 'Album slug');
  assertUnique(
    eras.map((era) => era.slug),
    'Era slug',
  );
  assertUnique(
    quotes.map((quote) => quote.id),
    'Quote id',
  );

  const allSongs: Song[] = [];
  for (const album of albums) {
    const songs = await readSongs(album.slug);
    allSongs.push(...songs);

    if (songs.length !== album.totalTracks) {
      fail(
        `${album.slug} has ${songs.length} song row(s), but album.totalTracks is ${album.totalTracks}.`,
      );
    }

    for (const song of songs) {
      if (song.albumSlug !== album.slug) {
        fail(`Song "${song.slug}" has albumSlug "${song.albumSlug}" in ${album.slug}.`);
      }
    }
  }

  const songSlugs = allSongs.map((song) => song.slug);
  const songSlugSet = new Set(songSlugs);
  assertUnique(songSlugs, 'Song slug');

  for (const era of eras) {
    for (const albumSlug of era.albumSlugs) {
      assertKnown(albumSlug, albumSlugSet, `Era "${era.slug}"`);
    }
  }

  for (const quote of quotes) {
    assertKnown(quote.albumSlug, albumSlugSet, `Quote "${quote.id}" albumSlug`);
    assertKnown(quote.songSlug, songSlugSet, `Quote "${quote.id}" songSlug`);
  }

  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log(
    `Data valid: ${albums.length} albums, ${allSongs.length} songs, ${quotes.length} quotes, ${eras.length} eras.`,
  );
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
