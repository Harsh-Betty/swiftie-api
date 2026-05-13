import { ALBUM_BY_SLUG, SONGS_META, SONGS_META_BY_SLUG } from '../__generated__/meta.js';
import type { ListSongsFilter, SongMeta } from '../shared/types.js';

export function getSong(slug: string): SongMeta {
  const song = SONGS_META_BY_SLUG.get(slug);
  if (!song) {
    throw new Error(`Song with slug "${slug}" was not found.`);
  }
  return song;
}

function isTaylorsVersion(albumSlug: string): boolean {
  return ALBUM_BY_SLUG.get(albumSlug)?.type === 'taylors_version';
}

export function getSongs(filter: ListSongsFilter = {}): SongMeta[] {
  const includeTV = filter.includeTaylorsVersions ?? false;
  const featureNeedle = filter.feature?.trim().toLowerCase();

  return SONGS_META.filter((song) => {
    if (!includeTV && isTaylorsVersion(song.albumSlug)) return false;
    if (filter.albumSlug !== undefined && song.albumSlug !== filter.albumSlug) return false;
    if (filter.isVaultTrack !== undefined && song.isVaultTrack !== filter.isVaultTrack)
      return false;
    if (filter.isBonusTrack !== undefined && song.isBonusTrack !== filter.isBonusTrack)
      return false;
    if (featureNeedle) {
      const hasFeature = song.features.some((f) => f.toLowerCase().includes(featureNeedle));
      if (!hasFeature) return false;
    }
    return true;
  });
}

/**
 * Simple in-memory search across song title, features, and writers. Case-insensitive
 * substring match; results sorted by title-match-first then alphabetical.
 */
export function searchSongs(query: string): SongMeta[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];

  const titleHits: SongMeta[] = [];
  const otherHits: SongMeta[] = [];

  for (const song of SONGS_META) {
    if (song.title.toLowerCase().includes(needle)) {
      titleHits.push(song);
      continue;
    }
    const fieldMatch =
      song.features.some((f) => f.toLowerCase().includes(needle)) ||
      song.writers.some((w) => w.toLowerCase().includes(needle));
    if (fieldMatch) {
      otherHits.push(song);
    }
  }

  return [
    ...titleHits.sort((a, b) => a.title.localeCompare(b.title)),
    ...otherHits.sort((a, b) => a.title.localeCompare(b.title)),
  ];
}

export function getRandomSong(): SongMeta {
  if (SONGS_META.length === 0) {
    throw new Error('No songs available.');
  }
  const index = Math.floor(Math.random() * SONGS_META.length);
  // biome-ignore lint/style/noNonNullAssertion: index is guaranteed in-range above
  return SONGS_META[index]!;
}
