import type {
  Album,
  Era,
  EraDetail,
  ListAlbumsFilter,
  ListQuotesFilter,
  ListSongsFilter,
  LyricSearchResult,
  Lyrics,
  PaginatedResult,
  Quote,
  Song,
} from '../shared/types.js';

export type SwiftieApiFetch = typeof globalThis.fetch;

export interface CreateClientOptions {
  /** Base URL of the hosted Swiftie API, e.g. `https://swiftie-api.example.com`. */
  baseUrl: string;
  /** Optional custom fetch implementation; defaults to `globalThis.fetch`. */
  fetch?: SwiftieApiFetch;
  /** Request timeout in milliseconds. Defaults to 10000. */
  timeoutMs?: number;
  /** Optional API key sent as `Authorization: Bearer <apiKey>`. */
  apiKey?: string;
  /** Extra headers merged into every request. */
  headers?: Record<string, string>;
}

export interface PaginatedQuery {
  limit?: number;
  offset?: number;
}

export type AlbumListQuery = ListAlbumsFilter & PaginatedQuery;
export type SongListQuery = ListSongsFilter & PaginatedQuery;
export interface QuoteListQuery extends ListQuotesFilter {
  limit?: number;
}
export interface LyricsSearchQuery {
  limit?: number;
}
export interface GetSongQuery {
  withLyrics?: boolean;
}
export interface DailyQuoteQuery {
  /** UTC date in YYYY-MM-DD form. Defaults to today on the server. */
  date?: string;
}

export interface SwiftieApiClient {
  albums: {
    list(query?: AlbumListQuery): Promise<PaginatedResult<Album>>;
    get(slug: string): Promise<Album>;
    songs(slug: string): Promise<Song[]>;
  };
  songs: {
    list(query?: SongListQuery): Promise<PaginatedResult<Song>>;
    get(slug: string, query?: GetSongQuery): Promise<Song>;
  };
  lyrics: {
    search(q: string, query?: LyricsSearchQuery): Promise<LyricSearchResult[]>;
    bySong(songSlug: string): Promise<Lyrics>;
  };
  quotes: {
    list(query?: QuoteListQuery): Promise<Quote[]>;
    random(): Promise<Quote>;
    daily(query?: DailyQuoteQuery): Promise<Quote>;
  };
  eras: {
    list(): Promise<Era[]>;
    get(slug: string): Promise<EraDetail>;
  };
}
