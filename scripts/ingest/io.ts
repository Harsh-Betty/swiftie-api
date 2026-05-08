import { readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as z from 'zod';
import { type Album, AlbumSchema, type Song, SongSchema } from '../../packages/data/src/schemas';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..');
const dataRoot = join(repoRoot, 'packages/data/src/data');

export const REPO_ROOT = repoRoot;
export const ALBUMS_DIR = join(dataRoot, 'albums');
export const SONGS_DIR = join(dataRoot, 'songs');
export const OVERRIDES_DIR = join(dataRoot, 'overrides');

const SongArraySchema = z.array(SongSchema);
const PartialAlbumSchema = AlbumSchema.partial();
const PartialSongSchema = SongSchema.partial();

const OverrideFileSchema = z.object({
  album: PartialAlbumSchema.optional(),
  songs: z.record(z.string(), PartialSongSchema).optional(),
});

export type AlbumOverride = z.infer<typeof PartialAlbumSchema>;
export type SongOverride = z.infer<typeof PartialSongSchema>;
export type OverrideFile = z.infer<typeof OverrideFileSchema>;

function isCommentEntry(entry: unknown): boolean {
  return typeof entry === 'object' && entry !== null && '_comment' in entry;
}

export async function listAlbumSlugs(): Promise<string[]> {
  const entries = await readdir(ALBUMS_DIR);
  return entries
    .filter((name) => name.endsWith('.json'))
    .map((name) => name.slice(0, -'.json'.length))
    .sort((a, b) => a.localeCompare(b));
}

export async function readAlbum(slug: string): Promise<Album> {
  const path = join(ALBUMS_DIR, `${slug}.json`);
  const raw = await readFile(path, 'utf8');
  const parsed: unknown = JSON.parse(raw);
  return AlbumSchema.parse(parsed);
}

export async function readSongs(slug: string): Promise<Song[]> {
  const path = join(SONGS_DIR, `${slug}.json`);
  const raw = await readFile(path, 'utf8');
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error(`Songs file ${path} is not a JSON array`);
  }
  const cleaned = parsed.filter((entry) => !isCommentEntry(entry));
  return SongArraySchema.parse(cleaned);
}

export async function readOverride(slug: string): Promise<OverrideFile | null> {
  const path = join(OVERRIDES_DIR, `${slug}.json`);
  let raw: string;
  try {
    raw = await readFile(path, 'utf8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw err;
  }
  const parsed: unknown = JSON.parse(raw);
  return OverrideFileSchema.parse(parsed);
}

export async function writeAlbum(slug: string, album: Album): Promise<void> {
  const validated = AlbumSchema.parse(album);
  const path = join(ALBUMS_DIR, `${slug}.json`);
  await writeFile(path, serialize(validated), 'utf8');
}

export async function writeSongs(slug: string, songs: Song[]): Promise<void> {
  const validated = SongArraySchema.parse(songs);
  const path = join(SONGS_DIR, `${slug}.json`);
  await writeFile(path, serialize(validated), 'utf8');
}

export function serialize(value: unknown): string {
  return `${JSON.stringify(sortKeys(value), null, 2)}\n`;
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((v) => sortKeys(v));
  }
  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(obj).sort((a, b) => a.localeCompare(b))) {
      sorted[key] = sortKeys(obj[key]);
    }
    return sorted;
  }
  return value;
}

export async function readJsonCache<T>(path: string): Promise<T | null> {
  try {
    const raw = await readFile(path, 'utf8');
    return JSON.parse(raw) as T;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw err;
  }
}

export async function writeJsonCache(path: string, value: unknown): Promise<void> {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}
