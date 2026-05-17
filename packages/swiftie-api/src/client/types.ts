import type {
  Album,
  Era,
  EraDetail,
  ListAlbumsFilter,
  LyricMatch,
  LyricSection,
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

export interface SongListQuery extends PaginatedQuery {
  album?: string;
  vault?: boolean;
  bonus?: boolean;
  feature?: string;
  includeTaylorsVersions?: boolean;
}

export interface QuoteListQuery {
  album?: string;
  song?: string;
  mood?: string;
  featured?: boolean;
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

export interface SongResponse extends Song {
  hasLyrics: boolean;
}

export interface HostedLyricsSearchResult {
  song: {
    slug: string;
    title: string;
  };
  album: {
    slug: string;
    title: string;
  };
  line: string;
  section: string;
  lineNumber: number;
  score: number;
  matches: LyricMatch[];
}

export interface HostedLyricsResponse {
  songSlug: string;
  songTitle: string;
  albumSlug: string;
  sections: LyricSection[];
}

export type ImageSource = 'cover' | 'spotify' | 'pexels' | 'unsplash' | 'reddit' | 'auto';
export type ImageSearchSource = 'pexels' | 'unsplash' | 'reddit';

export interface ImageQuery {
  source?: ImageSource;
  limit?: number;
}

export interface ImageSearchQuery {
  source?: ImageSearchSource;
  limit?: number;
}

export interface ImageAttribution {
  author?: string;
  authorUrl?: string;
  license?: string;
  licenseUrl?: string;
}

export interface ImageResult {
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  source: string;
  sourceUrl?: string;
  attribution: ImageAttribution;
  meta?: Record<string, unknown>;
}

export interface SwiftieApiClient {
  albums: {
    list(query?: AlbumListQuery): Promise<PaginatedResult<Album>>;
    get(slug: string): Promise<Album>;
    songs(slug: string): Promise<SongResponse[]>;
  };
  songs: {
    list(query?: SongListQuery): Promise<PaginatedResult<SongResponse>>;
    get(slug: string, query?: GetSongQuery): Promise<SongResponse>;
  };
  lyrics: {
    search(q: string, query?: LyricsSearchQuery): Promise<HostedLyricsSearchResult[]>;
    bySong(songSlug: string): Promise<HostedLyricsResponse>;
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
  images: {
    album(slug: string, query?: ImageQuery): Promise<ImageResult[]>;
    song(slug: string, query?: ImageQuery): Promise<ImageResult[]>;
    search(q: string, query?: ImageSearchQuery): Promise<ImageResult[]>;
  };
}
