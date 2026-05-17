import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { createClient } from '../src/client/create-client';
import { SwiftieApiError } from '../src/client/errors';

const BASE_URL = 'https://swiftie-api.test';

const cannedQuote = {
  id: 'test-1',
  text: 'sample lyric',
  songSlug: 'cruel-summer',
  albumSlug: 'lover',
  featured: false,
};

const cannedAlbum = { slug: 'lover', title: 'Lover', totalTracks: 18 };
const cannedSong = { slug: 'cruel-summer', title: 'Cruel Summer', hasLyrics: true };

const server = setupServer(
  http.get(`${BASE_URL}/api/v1/quotes/random`, () =>
    HttpResponse.json({ data: cannedQuote, meta: { timestamp: '2026-01-01T00:00:00Z' } }),
  ),
  http.get(`${BASE_URL}/api/v1/quotes`, () => HttpResponse.json({ data: [cannedQuote] })),
  http.get(`${BASE_URL}/api/v1/quotes/daily`, () => HttpResponse.json({ data: cannedQuote })),
  http.get(`${BASE_URL}/api/v1/albums`, () =>
    HttpResponse.json({ data: [cannedAlbum], meta: { total: 1, limit: 20, offset: 0 } }),
  ),
  http.get(`${BASE_URL}/api/v1/albums/lover`, () => HttpResponse.json({ data: cannedAlbum })),
  http.get(`${BASE_URL}/api/v1/albums/lover/songs`, () =>
    HttpResponse.json({ data: [cannedSong] }),
  ),
  http.get(`${BASE_URL}/api/v1/songs`, () =>
    HttpResponse.json({ data: [cannedSong], meta: { total: 1, limit: 20, offset: 0 } }),
  ),
  http.get(`${BASE_URL}/api/v1/songs/cruel-summer`, () => HttpResponse.json({ data: cannedSong })),
  http.get(`${BASE_URL}/api/v1/lyrics/search`, () => HttpResponse.json({ data: [] })),
  http.get(`${BASE_URL}/api/v1/lyrics/cruel-summer`, () =>
    HttpResponse.json({
      data: {
        songSlug: 'cruel-summer',
        songTitle: 'Cruel Summer',
        albumSlug: 'lover',
        sections: [],
      },
    }),
  ),
  http.get(`${BASE_URL}/api/v1/eras`, () => HttpResponse.json({ data: [{ slug: 'lover' }] })),
  http.get(`${BASE_URL}/api/v1/eras/lover`, () =>
    HttpResponse.json({ data: { slug: 'lover', albums: [cannedAlbum] } }),
  ),
  http.get(`${BASE_URL}/api/v1/images/album/lover`, () => HttpResponse.json({ data: [] })),
  http.get(`${BASE_URL}/api/v1/images/song/cruel-summer`, () => HttpResponse.json({ data: [] })),
  http.get(`${BASE_URL}/api/v1/images/search`, () => HttpResponse.json({ data: [] })),
  http.get(`${BASE_URL}/api/v1/albums/nope`, () =>
    HttpResponse.json(
      { error: { code: 'NOT_FOUND', message: 'No album exists for the given slug.' } },
      { status: 404 },
    ),
  ),
);

describe('swiftie-api hosted client', () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  it('unwraps the envelope on a 200 response', async () => {
    const client = createClient({ baseUrl: BASE_URL });
    const quote = await client.quotes.random();
    expect(quote.id).toBe('test-1');
    expect(quote.songSlug).toBe('cruel-summer');
  });

  it('throws SwiftieApiError with status 404 on a not-found response', async () => {
    const client = createClient({ baseUrl: BASE_URL });
    try {
      await client.albums.get('nope');
      throw new Error('Expected SwiftieApiError to be thrown.');
    } catch (err) {
      expect(err).toBeInstanceOf(SwiftieApiError);
      expect((err as SwiftieApiError).status).toBe(404);
    }
  });

  it('exposes every documented client method against the mocked server', async () => {
    const client = createClient({ baseUrl: BASE_URL, apiKey: 'test-key' });

    await expect(client.albums.list({ limit: 20 })).resolves.toMatchObject({
      data: [cannedAlbum],
    });
    await expect(client.albums.get('lover')).resolves.toMatchObject({ slug: 'lover' });
    await expect(client.albums.songs('lover')).resolves.toEqual([cannedSong]);
    await expect(client.songs.list({ album: 'lover' })).resolves.toMatchObject({
      data: [cannedSong],
    });
    await expect(client.songs.get('cruel-summer')).resolves.toMatchObject({
      slug: 'cruel-summer',
    });
    await expect(client.lyrics.search('summer', { limit: 5 })).resolves.toEqual([]);
    await expect(client.lyrics.bySong('cruel-summer')).resolves.toMatchObject({
      songSlug: 'cruel-summer',
    });
    await expect(client.quotes.list({ album: 'lover' })).resolves.toEqual([cannedQuote]);
    await expect(client.quotes.daily({ date: '2026-05-10' })).resolves.toMatchObject({
      id: 'test-1',
    });
    await expect(client.eras.list()).resolves.toMatchObject([{ slug: 'lover' }]);
    await expect(client.eras.get('lover')).resolves.toMatchObject({ slug: 'lover' });
    await expect(client.images.album('lover', { limit: 5 })).resolves.toEqual([]);
    await expect(client.images.song('cruel-summer', { limit: 5 })).resolves.toEqual([]);
    await expect(client.images.search('lover', { source: 'pexels' })).resolves.toEqual([]);
  });
});
