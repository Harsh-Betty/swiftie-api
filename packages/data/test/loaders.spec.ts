import { describe, expect, it } from 'vitest';
import { getAlbum, listAlbums } from '../src/loaders/album';
import { getEra, getEras } from '../src/loaders/era';
import { getDailyQuote, getRandomQuote, listQuotes } from '../src/loaders/quote';
import { searchLyrics } from '../src/loaders/search';
import { getSong, getSongsByAlbum, listSongs } from '../src/loaders/song';

describe('getAlbum', () => {
  it('returns the seeded Lover album', async () => {
    const album = await getAlbum('lover');
    expect(album.slug).toBe('lover');
    expect(album.title).toBe('Lover');
    expect(album.totalTracks).toBe(18);
  });

  it('rejects for an unknown slug', async () => {
    await expect(getAlbum('does-not-exist')).rejects.toThrow();
  });
});

describe('listAlbums', () => {
  it("filters out Taylor's Versions by default and sorts by release date", async () => {
    const albums = await listAlbums();
    expect(albums.every((a) => a.type !== 'taylors_version')).toBe(true);
    for (let i = 1; i < albums.length; i++) {
      expect(albums[i - 1]!.releaseDate <= albums[i]!.releaseDate).toBe(true);
    }
  });
});

describe('getSongsByAlbum + getSong + listSongs', () => {
  it('getSongsByAlbum returns 18 songs for Lover, all with albumSlug "lover"', async () => {
    const songs = await getSongsByAlbum('lover');
    expect(songs).toHaveLength(18);
    expect(songs.every((s) => s.albumSlug === 'lover')).toBe(true);
  });

  it('getSong("cruel-summer") returns the song', async () => {
    const song = await getSong('cruel-summer');
    expect(song.slug).toBe('cruel-summer');
    expect(song.albumSlug).toBe('lover');
  });

  it('listSongs() returns a flat array of songs', async () => {
    const songs = await listSongs();
    expect(songs.length).toBeGreaterThan(0);
    expect(songs.some((s) => s.slug === 'cruel-summer')).toBe(true);
  });
});

describe('eras', () => {
  it('getEras returns a non-empty list', async () => {
    const eras = await getEras();
    expect(eras.length).toBeGreaterThan(0);
  });

  it('getEra("lover") returns the Lover era', async () => {
    const era = await getEra('lover');
    expect(era.slug).toBe('lover');
  });
});

describe('quotes', () => {
  it('getDailyQuote is deterministic for a fixed UTC date', async () => {
    const date = new Date('2026-05-10T00:00:00Z');
    const first = await getDailyQuote(date);
    const second = await getDailyQuote(date);
    expect(first.id).toBe(second.id);
  });

  it('getRandomQuote returns a quote', async () => {
    const quote = await getRandomQuote();
    expect(typeof quote.text).toBe('string');
  });

  it('listQuotes filters by albumSlug', async () => {
    const quotes = await listQuotes({ albumSlug: 'lover' });
    expect(quotes.every((q) => q.albumSlug === 'lover')).toBe(true);
  });
});

describe('searchLyrics', () => {
  it('returns an empty array for an empty query', async () => {
    const results = await searchLyrics('');
    expect(results).toEqual([]);
  });

  it('respects the limit option', async () => {
    const results = await searchLyrics('summer', { limit: 5 });
    expect(results.length).toBeLessThanOrEqual(5);
  });
});
