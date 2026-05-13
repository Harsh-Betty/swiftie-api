import { type Song, SongSchema } from '../../packages/data/src/schemas';

export interface SongSeed {
  title: string;
  albumSlug: string;
  slug: string;
  trackNumber: number;
  discNumber: number;
  durationSeconds: number;
  spotifyTrackId?: string;
  isrc?: string;
  musicbrainzRecordingId?: string;
}

export function slugifySongTitle(title: string): string {
  return title
    .normalize('NFKD')
    .replaceAll(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replaceAll('&', 'and')
    .replaceAll(/['\u2019]/g, '')
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-+|-+$/g, '');
}

export function songSeedKey(seed: Pick<SongSeed, 'discNumber' | 'trackNumber'>): string {
  return `${seed.discNumber}:${seed.trackNumber}`;
}

function optionalString(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

export function createSongFromSeed(seed: SongSeed): Song {
  const slug =
    optionalString(seed.slug) ??
    optionalString(slugifySongTitle(seed.title)) ??
    `disc-${seed.discNumber}-track-${seed.trackNumber}`;

  const song: Song = {
    albumSlug: seed.albumSlug,
    discNumber: seed.discNumber,
    durationSeconds: seed.durationSeconds,
    features: [],
    isBonusTrack: false,
    isPromotionalRelease: false,
    isVaultTrack: false,
    lyrics: { sections: [] },
    moods: [],
    producers: [],
    slug,
    themes: [],
    title: seed.title,
    trackNumber: seed.trackNumber,
    writers: [],
  };

  const spotifyTrackId = optionalString(seed.spotifyTrackId);
  if (spotifyTrackId) song.spotifyTrackId = spotifyTrackId;

  const isrc = optionalString(seed.isrc);
  if (isrc) song.isrc = isrc;

  const musicbrainzRecordingId = optionalString(seed.musicbrainzRecordingId);
  if (musicbrainzRecordingId) song.musicbrainzRecordingId = musicbrainzRecordingId;

  return SongSchema.parse(song);
}

export function createSongPartialFromSeed(seed: SongSeed): Partial<Song> {
  const partial: Partial<Song> = {};

  if (seed.durationSeconds > 0) partial.durationSeconds = seed.durationSeconds;

  const spotifyTrackId = optionalString(seed.spotifyTrackId);
  if (spotifyTrackId) partial.spotifyTrackId = spotifyTrackId;

  const isrc = optionalString(seed.isrc);
  if (isrc) partial.isrc = isrc;

  const musicbrainzRecordingId = optionalString(seed.musicbrainzRecordingId);
  if (musicbrainzRecordingId) partial.musicbrainzRecordingId = musicbrainzRecordingId;

  return partial;
}

export function mergeSongSeedLists(seedLists: readonly (readonly SongSeed[])[]): SongSeed[] {
  const byPosition = new Map<string, SongSeed>();

  for (const seeds of seedLists) {
    for (const seed of seeds) {
      const key = songSeedKey(seed);
      const existing = byPosition.get(key);
      if (!existing) {
        byPosition.set(key, seed);
        continue;
      }

      byPosition.set(key, {
        ...existing,
        title: existing.title || seed.title,
        slug: existing.slug || seed.slug,
        durationSeconds: existing.durationSeconds || seed.durationSeconds,
        spotifyTrackId: existing.spotifyTrackId || seed.spotifyTrackId,
        isrc: existing.isrc || seed.isrc,
        musicbrainzRecordingId: existing.musicbrainzRecordingId || seed.musicbrainzRecordingId,
      });
    }
  }

  return [...byPosition.values()].sort(
    (a, b) => a.discNumber - b.discNumber || a.trackNumber - b.trackNumber,
  );
}
