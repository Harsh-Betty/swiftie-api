import type { Album, Song } from '../../packages/data/src/schemas';
import type { AdapterContext, DataSourceAdapter } from './adapters/adapter';
import type { Summary } from './diff';
import { mergeSong } from './merge';
import {
  createSongFromSeed,
  createSongPartialFromSeed,
  mergeSongSeedLists,
  type SongSeed,
  songSeedKey,
} from './song-seed';

const BOOTSTRAP_SOURCE = 'bootstrap-songs';

function adapterRank(adapter: DataSourceAdapter): number {
  if (adapter.id === 'spotify') return 0;
  if (adapter.id === 'musicbrainz') return 1;
  return 2;
}

function songPositionKey(song: Pick<Song, 'discNumber' | 'trackNumber'>): string {
  return `${song.discNumber}:${song.trackNumber}`;
}

function uniqueSlug(baseSlug: string, usedSlugs: Set<string>, seed: SongSeed): string {
  if (!usedSlugs.has(baseSlug)) return baseSlug;

  const withTrack = `${baseSlug}-${seed.trackNumber}`;
  if (!usedSlugs.has(withTrack)) return withTrack;

  let suffix = 2;
  while (usedSlugs.has(`${withTrack}-${suffix}`)) {
    suffix += 1;
  }
  return `${withTrack}-${suffix}`;
}

export async function collectSongSeeds(
  album: Album,
  adapters: readonly DataSourceAdapter[],
  ctx: AdapterContext,
  summary?: Summary,
): Promise<SongSeed[]> {
  const trackAdapters = adapters
    .filter((adapter) => adapter.listAlbumTracks)
    .sort((a, b) => adapterRank(a) - adapterRank(b));

  const seedLists: SongSeed[][] = [];
  for (const adapter of trackAdapters) {
    try {
      const seeds = await adapter.listAlbumTracks?.(album, ctx);
      if (seeds && seeds.length > 0) {
        seedLists.push(seeds);
      }
    } catch (err) {
      summary?.recordError(album.slug, adapter.id, err);
      ctx.logger.warn(
        { err: (err as Error).message, album: album.slug, adapter: adapter.id },
        'track bootstrap failed',
      );
    }
  }

  return mergeSongSeedLists(seedLists);
}

export function bootstrapSongList(
  album: Album,
  songs: readonly Song[],
  seeds: readonly SongSeed[],
  summary?: Summary,
): Song[] {
  if (seeds.length === 0) return [...songs];

  const maxSongs = album.totalTracks > 0 ? album.totalTracks : Number.POSITIVE_INFINITY;
  const seedByPosition = new Map(seeds.map((seed) => [songSeedKey(seed), seed]));
  const seedBySlug = new Map(seeds.map((seed) => [seed.slug, seed]));
  const usedSeedKeys = new Set<string>();
  const usedSlugs = new Set(songs.map((song) => song.slug));

  const updated = songs.map((song) => {
    const positionKey = songPositionKey(song);
    const seed = seedByPosition.get(positionKey) ?? seedBySlug.get(song.slug);
    if (!seed) return song;

    usedSeedKeys.add(songSeedKey(seed));
    return mergeSong(song, createSongPartialFromSeed(seed), {
      source: BOOTSTRAP_SOURCE,
      summary,
      scope: { kind: 'song', albumSlug: album.slug, songSlug: song.slug },
    });
  });

  const occupiedPositions = new Set(updated.map((song) => songPositionKey(song)));
  for (const seed of seeds) {
    if (updated.length >= maxSongs) break;

    const seedKey = songSeedKey(seed);
    if (usedSeedKeys.has(seedKey) || occupiedPositions.has(seedKey)) {
      continue;
    }

    const baseSong = createSongFromSeed(seed);
    const song =
      usedSlugs.has(baseSong.slug) || baseSong.albumSlug !== album.slug
        ? createSongFromSeed({
            ...seed,
            albumSlug: album.slug,
            slug: uniqueSlug(baseSong.slug, usedSlugs, seed),
          })
        : baseSong;

    usedSlugs.add(song.slug);
    occupiedPositions.add(songPositionKey(song));
    updated.push(song);
    summary?.recordFill({
      scope: { kind: 'song', albumSlug: album.slug, songSlug: song.slug },
      source: BOOTSTRAP_SOURCE,
      field: 'song',
      before: undefined,
      after: song.title,
    });
  }

  return updated
    .sort((a, b) => a.discNumber - b.discNumber || a.trackNumber - b.trackNumber)
    .slice(0, maxSongs);
}
