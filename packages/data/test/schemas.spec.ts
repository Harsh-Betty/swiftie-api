import { describe, expect, it } from 'vitest';
import { AlbumSchema } from '../src/schemas/album';
import { EraSchema } from '../src/schemas/era';
import { QuoteSchema } from '../src/schemas/quote';
import { SongSchema } from '../src/schemas/song';

const validAlbum = {
  slug: 'lover',
  title: 'Lover',
  type: 'studio' as const,
  era: 'lover',
  releaseDate: '2019-08-23',
  producers: ['Taylor Swift'],
  writers: ['Taylor Swift'],
  label: 'Republic Records',
  totalTracks: 18,
  taylorsVersion: { status: 'not_applicable' as const },
  coverArt: { primary: '', sources: {} },
  description: 'Lover',
  trivia: [],
};

const validSong = {
  slug: 'cruel-summer',
  title: 'Cruel Summer',
  albumSlug: 'lover',
  trackNumber: 2,
  durationSeconds: 178,
  writers: ['Taylor Swift'],
  producers: ['Taylor Swift'],
  features: [],
  moods: [],
  themes: [],
  lyrics: { sections: [] },
};

describe('AlbumSchema', () => {
  it('accepts a valid album', () => {
    const parsed = AlbumSchema.parse(validAlbum);
    expect(parsed.slug).toBe('lover');
  });

  it('rejects an album missing coverArt', () => {
    const { coverArt: _omit, ...invalid } = validAlbum;
    expect(() => AlbumSchema.parse(invalid)).toThrow();
  });
});

describe('SongSchema', () => {
  it('accepts a valid song', () => {
    const parsed = SongSchema.parse(validSong);
    expect(parsed.slug).toBe('cruel-summer');
  });

  it('rejects a song with a non-kebab slug', () => {
    expect(() => SongSchema.parse({ ...validSong, slug: 'Cruel Summer' })).toThrow();
  });
});

describe('QuoteSchema', () => {
  it('rejects text longer than 300 characters', () => {
    expect(() =>
      QuoteSchema.parse({
        id: 'q1',
        text: 'x'.repeat(301),
        songSlug: 'cruel-summer',
        albumSlug: 'lover',
      }),
    ).toThrow();
  });
});

describe('EraSchema', () => {
  it('accepts a valid era entry', () => {
    const parsed = EraSchema.parse({
      slug: 'lover',
      name: 'Lover',
      displayName: 'Lover',
      color: '#ffb6c1',
      description: 'Lover era.',
      startDate: '2019-08-23',
      endDate: '2020-07-23',
      albumSlugs: ['lover'],
      iconographyKeywords: ['pastel', 'butterfly'],
    });
    expect(parsed.slug).toBe('lover');
  });
});
