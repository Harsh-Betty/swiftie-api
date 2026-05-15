# swiftie-api

> A free, fan-made library for Taylor Swift discography, lyrics, eras, and quotes — offline-bundled data with an optional hosted client.

`swiftie-api` ships every album, song, and curated quote in the published bundle, so most calls are synchronous and zero-network. Per-album lyrics load lazily through tree-shake-friendly subpaths, and an optional `createClient` factory targets the hosted REST API when you want server-side filtering or shared state.

## Install

```bash
pnpm add swiftie-api
# or
npm install swiftie-api
# or
yarn add swiftie-api
```

No peer dependencies. Works in Node 18+, modern browsers, Bun, and Deno.

## Quick start

### Offline mode (default — bundles data)

```ts
import {
  getAlbum,
  getAllAlbums,
  getAlbumWithSongs,
  getSong,
  getSongs,
  searchSongs,
  searchLyrics,
  getRandomQuote,
  getDailyQuote,
  getQuotes,
  getRandomSong,
  getEra,
  getAllEras,
} from 'swiftie-api';

const lover = getAlbum('lover');                  // sync
const eras = getAllEras();                        // sync
const todaysQuote = getDailyQuote();              // sync (deterministic by UTC date)
const cardigan = getSong('cardigan');             // sync, SongMeta (lyrics omitted)

const loverFull = await getAlbumWithSongs('lover');         // async, lyrics included
const hits = await searchLyrics('cruel summer', { limit: 5 }); // async, lazy index
```

### Hosted mode

```ts
import { createClient, SwiftieApiError } from 'swiftie-api';

const client = createClient({
  baseUrl: 'https://swiftie-api.hrshvrdhn.com',
  timeoutMs: 5000,
  apiKey: 'optional',
});

try {
  const albums = await client.albums.list({ era: 'lover' });
  const cardigan = await client.songs.get('cardigan');
  const quote = await client.quotes.daily();
  console.log(albums.data.length, cardigan.title, quote.text);
} catch (err) {
  if (err instanceof SwiftieApiError) {
    console.error(err.status, err.url, err.body);
  }
}
```

### Per-album subpath (tree-shake friendly)

```ts
import lover from 'swiftie-api/albums/lover';

console.log(lover.title, lover.songs.length);
console.log(lover.songs[0].lyrics.sections);
```

Only the album you import lands in your bundle.

## API reference

### Offline

| Function | Signature | Returns | Sync/Async |
| --- | --- | --- | --- |
| `getAlbum` | `(slug: string)` | `Album` | sync |
| `getAllAlbums` | `()` | `Album[]` | sync |
| `getAlbumWithSongs` | `(slug: string)` | `Promise<AlbumWithSongs>` | async |
| `getSong` | `(slug: string)` | `SongMeta` | sync |
| `getSongs` | `(filter?: ListSongsFilter)` | `SongMeta[]` | sync |
| `searchSongs` | `(query: string)` | `SongMeta[]` | sync |
| `getRandomSong` | `()` | `SongMeta` | sync |
| `searchLyrics` | `(query: string, opts?)` | `Promise<LyricSearchResult[]>` | async |
| `getRandomQuote` | `()` | `Quote` | sync |
| `getDailyQuote` | `(date?: Date)` | `Quote` | sync |
| `getQuotes` | `(filter?: ListQuotesFilter)` | `Quote[]` | sync |
| `getEra` | `(slug: string)` | `Era` | sync |
| `getAllEras` | `()` | `Era[]` | sync |

`SongMeta` is `Omit<Song, 'lyrics'>`. Sync APIs return `SongMeta` so the inlined metadata stays small; reach for `getAlbumWithSongs(slug)` or the per-album subpath when you need lyric text.

Note: the first call to `searchLyrics` lazy-imports every per-album bundle to build the search index. If you import `searchLyrics` in the same module as a single-album subpath, expect all album chunks to land in your bundle.

### Hosted client

| Method | HTTP target |
| --- | --- |
| `client.albums.list(query?)` | `GET /api/v1/albums` |
| `client.albums.get(slug)` | `GET /api/v1/albums/:slug` |
| `client.albums.songs(slug)` | `GET /api/v1/albums/:slug/songs` |
| `client.songs.list(query?)` | `GET /api/v1/songs` |
| `client.songs.get(slug, query?)` | `GET /api/v1/songs/:slug` |
| `client.lyrics.search(q, query?)` | `GET /api/v1/lyrics/search` |
| `client.lyrics.bySong(songSlug)` | `GET /api/v1/lyrics/:songSlug` |
| `client.quotes.list(query?)` | `GET /api/v1/quotes` |
| `client.quotes.random()` | `GET /api/v1/quotes/random` |
| `client.quotes.daily(query?)` | `GET /api/v1/quotes/daily` |
| `client.eras.list()` | `GET /api/v1/eras` |
| `client.eras.get(slug)` | `GET /api/v1/eras/:slug` |

All methods are async. Non-2xx responses throw `SwiftieApiError` with `status`, `url`, and parsed `body`. Network and timeout failures throw `SwiftieApiError` with `status: 0`.

## Compatibility

- **Node**: 18+
- **Browsers**: every evergreen browser that ships `fetch` + dynamic `import()`
- **Bun / Deno**: yes
- The offline mode does not import any `node:*` modules or make network requests.

## Bundle size

The eager metadata bundle holds every album + every song without lyrics + every quote + every era. Per-album lyrics are loaded on demand. Lyrics search lazy-imports all per-album chunks on first call, then caches the MiniSearch index.

After publishing, see [the bundlephobia page](https://bundlephobia.com/package/swiftie-api) for current numbers.

## Data provenance

Album and song metadata is curated by hand and cross-referenced against MusicBrainz and Spotify catalog IDs. See [CREDITS.md](https://github.com/Harsh-Betty/swiftie-api/blob/main/CREDITS.md) at the repo root for full attribution.

## License

[MIT](./LICENSE) © Harshvardhan Singh.

Swiftie API is a fan-made project. It is **not** affiliated with, endorsed by, or sponsored by Taylor Swift, her management, her record labels, or any rights-holder.

If it saved you an afternoon, [buy me a coffee](https://www.buymeacoffee.com/hrshvrdhn).
