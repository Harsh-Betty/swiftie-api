import { describe, expect, it } from 'vitest';
import type { DataSourceAdapter } from '../../../scripts/ingest/adapters/adapter';
import { bootstrapSongList, collectSongSeeds } from '../../../scripts/ingest/bootstrap-songs';
import type { Logger } from '../../../scripts/ingest/logger';
import type { SongSeed } from '../../../scripts/ingest/song-seed';
import type { Album, Song } from '../src/schemas';
import { SongSchema } from '../src/schemas';

const album: Album = {
  coverArt: {
    primary: '',
    sources: {},
  },
  description: '',
  era: 'test-era',
  label: 'Test Label',
  producers: [],
  releaseDate: '2024-01-01',
  slug: 'test-album',
  taylorsVersion: {
    status: 'not_applicable',
  },
  title: 'Test Album',
  totalTracks: 2,
  trivia: [],
  type: 'studio',
  writers: [],
};

const seeds: SongSeed[] = [
  {
    albumSlug: album.slug,
    discNumber: 1,
    durationSeconds: 181,
    isrc: 'USAAA2400001',
    slug: 'first-song',
    spotifyTrackId: 'spotify-1',
    title: 'First Song',
    trackNumber: 1,
  },
  {
    albumSlug: album.slug,
    discNumber: 1,
    durationSeconds: 202,
    musicbrainzRecordingId: 'mb-recording-2',
    slug: 'second-song',
    title: 'Second Song',
    trackNumber: 2,
  },
];

function existingSong(overrides: Partial<Song> = {}): Song {
  return SongSchema.parse({
    albumSlug: album.slug,
    discNumber: 1,
    durationSeconds: 100,
    features: [],
    isBonusTrack: false,
    isPromotionalRelease: false,
    isVaultTrack: false,
    lyrics: {
      sections: [{ name: 'Verse', lines: ['manual lyric'] }],
    },
    moods: ['curated'],
    producers: ['Manual Producer'],
    slug: 'first-song',
    spotifyTrackId: '',
    themes: ['manual-theme'],
    title: 'Manual Title',
    trackNumber: 1,
    writers: ['Manual Writer'],
    ...overrides,
  });
}

describe('bootstrapSongList', () => {
  it('creates valid song stubs from seeds for an empty song array', () => {
    const result = bootstrapSongList(album, [], seeds);

    expect(result).toHaveLength(album.totalTracks);
    expect(result.map((song) => SongSchema.parse(song))).toHaveLength(album.totalTracks);
    expect(result[0]).toMatchObject({
      albumSlug: album.slug,
      discNumber: 1,
      durationSeconds: 181,
      features: [],
      isBonusTrack: false,
      isPromotionalRelease: false,
      isVaultTrack: false,
      lyrics: { sections: [] },
      slug: 'first-song',
      spotifyTrackId: 'spotify-1',
      title: 'First Song',
      trackNumber: 1,
    });
    expect(result[1]?.musicbrainzRecordingId).toBe('mb-recording-2');
  });

  it('preserves existing curated fields and lyrics while filling blank metadata', () => {
    const result = bootstrapSongList(album, [existingSong()], seeds);

    expect(result).toHaveLength(album.totalTracks);
    expect(result[0]).toMatchObject({
      durationSeconds: 100,
      isrc: 'USAAA2400001',
      lyrics: {
        sections: [{ name: 'Verse', lines: ['manual lyric'] }],
      },
      moods: ['curated'],
      producers: ['Manual Producer'],
      slug: 'first-song',
      spotifyTrackId: 'spotify-1',
      themes: ['manual-theme'],
      title: 'Manual Title',
      writers: ['Manual Writer'],
    });
  });

  it('is idempotent and does not duplicate songs on rerun', () => {
    const once = bootstrapSongList(album, [], seeds);
    const twice = bootstrapSongList(album, once, seeds);

    expect(once).toHaveLength(album.totalTracks);
    expect(twice).toHaveLength(album.totalTracks);
    expect(twice.map((song) => song.slug)).toEqual(['first-song', 'second-song']);
  });

  it('merges Spotify and MusicBrainz track seeds by position with source priority', async () => {
    const adapters: DataSourceAdapter[] = [
      {
        displayName: 'MusicBrainz',
        id: 'musicbrainz',
        isAvailable: () => true,
        listAlbumTracks: async () => [
          {
            albumSlug: album.slug,
            discNumber: 1,
            durationSeconds: 0,
            musicbrainzRecordingId: 'mb-recording-1',
            slug: 'mb-title',
            title: 'MB Title',
            trackNumber: 1,
          },
        ],
      },
      {
        displayName: 'Spotify',
        id: 'spotify',
        isAvailable: () => true,
        listAlbumTracks: async () => [
          {
            albumSlug: album.slug,
            discNumber: 1,
            durationSeconds: 181,
            slug: 'spotify-title',
            spotifyTrackId: 'spotify-1',
            title: 'Spotify Title',
            trackNumber: 1,
          },
        ],
      },
    ];

    const result = await collectSongSeeds(album, adapters, {
      env: {},
      logger: { warn: () => undefined } as unknown as Logger,
    });

    expect(result).toEqual([
      {
        albumSlug: album.slug,
        discNumber: 1,
        durationSeconds: 181,
        musicbrainzRecordingId: 'mb-recording-1',
        slug: 'spotify-title',
        spotifyTrackId: 'spotify-1',
        title: 'Spotify Title',
        trackNumber: 1,
      },
    ]);
  });
});
