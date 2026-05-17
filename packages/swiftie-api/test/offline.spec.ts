import { describe, expect, it } from 'vitest';
import { getAlbum, getAlbumWithSongs, getAllAlbums } from '../src/offline/albums';
import { getAllEras, getEra } from '../src/offline/eras';
import { getDailyQuote, getQuotes, getRandomQuote } from '../src/offline/quotes';
import { getRandomSong, getSong, getSongs, searchSongs } from '../src/offline/songs';

describe('swiftie-api offline / albums', () => {
  it('getAlbum("lover") returns the Lover album', () => {
    const album = getAlbum('lover');
    expect(album.slug).toBe('lover');
    expect(album.title).toBe('Lover');
    expect(album.totalTracks).toBe(18);
  });

  it('getAlbum("nope") throws', () => {
    expect(() => getAlbum('nope')).toThrow();
  });

  it('getAllAlbums returns albums sorted by release date', () => {
    const albums = getAllAlbums();
    expect(albums.length).toBeGreaterThan(0);
    for (let i = 1; i < albums.length; i++) {
      expect(albums[i - 1]!.releaseDate <= albums[i]!.releaseDate).toBe(true);
    }
  });

  it('per-album subpath import resolves to AlbumWithSongs', async () => {
    // Subpath imports in the published package map `swiftie-api/albums/lover`
    // to a per-album dist bundle. In source the same data lives in the
    // generated entry file; testing through the source path also keeps the
    // module reachable for coverage instrumentation.
    const mod = await import('../src/__generated__/albums/lover');
    expect(mod.default.slug).toBe('lover');
    expect(Array.isArray(mod.default.songs)).toBe(true);
    expect(mod.default.songs.length).toBe(18);
  });

  it('getAlbumWithSongs rejects for an unknown slug', async () => {
    await expect(getAlbumWithSongs('nope')).rejects.toThrow();
  });
});

describe('swiftie-api offline / eras', () => {
  it('getAllEras returns a non-empty list', () => {
    expect(getAllEras().length).toBeGreaterThan(0);
  });

  it('getEra("lover") returns the Lover era', () => {
    expect(getEra('lover').slug).toBe('lover');
  });

  it('getEra("nope") throws', () => {
    expect(() => getEra('nope')).toThrow();
  });
});

describe('swiftie-api offline / quotes', () => {
  it('getRandomQuote returns a Quote', () => {
    const quote = getRandomQuote();
    expect(typeof quote.text).toBe('string');
    expect(typeof quote.songSlug).toBe('string');
  });

  it('getDailyQuote is deterministic for a fixed UTC date', () => {
    const date = new Date('2026-05-10T00:00:00Z');
    expect(getDailyQuote(date).id).toBe(getDailyQuote(date).id);
  });

  it('getQuotes filters by albumSlug', () => {
    const quotes = getQuotes({ albumSlug: 'lover' });
    expect(quotes.every((q) => q.albumSlug === 'lover')).toBe(true);
  });
});

describe('swiftie-api offline / songs', () => {
  it('getSong("cruel-summer") returns the song', () => {
    expect(getSong('cruel-summer').slug).toBe('cruel-summer');
  });

  it('getSong("nope") throws', () => {
    expect(() => getSong('nope')).toThrow();
  });

  it('getSongs filters by albumSlug', () => {
    const songs = getSongs({ albumSlug: 'lover' });
    expect(songs.every((s) => s.albumSlug === 'lover')).toBe(true);
  });

  it('searchSongs finds title matches', () => {
    const hits = searchSongs('cruel summer');
    expect(hits.some((s) => s.slug === 'cruel-summer')).toBe(true);
  });

  it('searchSongs returns empty for an empty query', () => {
    expect(searchSongs('')).toEqual([]);
  });

  it('getRandomSong returns a SongMeta', () => {
    const song = getRandomSong();
    expect(typeof song.slug).toBe('string');
  });
});
