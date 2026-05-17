import type { Album, Era, EraDetail, PaginatedResult, Quote } from '../shared/types.js';
import { resolveOptions, SwiftieHttpClient } from './http-client.js';
import type {
  CreateClientOptions,
  HostedLyricsResponse,
  HostedLyricsSearchResult,
  ImageResult,
  SongResponse,
  SwiftieApiClient,
} from './types.js';

const API_PREFIX = '/api/v1';

/**
 * Creates a client for the hosted Swiftie API. All methods are async and throw
 * `SwiftieApiError` on non-2xx responses or transport failures.
 */
export function createClient(options: CreateClientOptions): SwiftieApiClient {
  const http = new SwiftieHttpClient(resolveOptions(options));

  return {
    albums: {
      list: (query) =>
        http.getRaw<PaginatedResult<Album>>(
          `${API_PREFIX}/albums`,
          query as Record<string, unknown> | undefined,
        ),
      get: (slug) => http.get<Album>(`${API_PREFIX}/albums/${encodeURIComponent(slug)}`),
      songs: (slug) =>
        http.get<SongResponse[]>(`${API_PREFIX}/albums/${encodeURIComponent(slug)}/songs`),
    },
    songs: {
      list: (query) =>
        http.getRaw<PaginatedResult<SongResponse>>(
          `${API_PREFIX}/songs`,
          query as Record<string, unknown> | undefined,
        ),
      get: (slug, query) =>
        http.get<SongResponse>(
          `${API_PREFIX}/songs/${encodeURIComponent(slug)}`,
          query as Record<string, unknown> | undefined,
        ),
    },
    lyrics: {
      search: (q, query) =>
        http.get<HostedLyricsSearchResult[]>(`${API_PREFIX}/lyrics/search`, {
          q,
          ...((query ?? {}) as Record<string, unknown>),
        }),
      bySong: (songSlug) =>
        http.get<HostedLyricsResponse>(`${API_PREFIX}/lyrics/${encodeURIComponent(songSlug)}`),
    },
    quotes: {
      list: (query) =>
        http.get<Quote[]>(`${API_PREFIX}/quotes`, query as Record<string, unknown> | undefined),
      random: () => http.get<Quote>(`${API_PREFIX}/quotes/random`),
      daily: (query) =>
        http.get<Quote>(`${API_PREFIX}/quotes/daily`, query as Record<string, unknown> | undefined),
    },
    eras: {
      list: () => http.get<Era[]>(`${API_PREFIX}/eras`),
      get: (slug) => http.get<EraDetail>(`${API_PREFIX}/eras/${encodeURIComponent(slug)}`),
    },
    images: {
      album: (slug, query) =>
        http.get<ImageResult[]>(
          `${API_PREFIX}/images/album/${encodeURIComponent(slug)}`,
          query as Record<string, unknown> | undefined,
        ),
      song: (slug, query) =>
        http.get<ImageResult[]>(
          `${API_PREFIX}/images/song/${encodeURIComponent(slug)}`,
          query as Record<string, unknown> | undefined,
        ),
      search: (q, query) =>
        http.get<ImageResult[]>(`${API_PREFIX}/images/search`, {
          q,
          ...((query ?? {}) as Record<string, unknown>),
        }),
    },
  };
}
