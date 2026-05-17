export { createClient } from './client/create-client.js';
export { SwiftieApiError } from './client/errors.js';
export type {
  AlbumListQuery,
  CreateClientOptions,
  DailyQuoteQuery,
  GetSongQuery,
  HostedLyricsResponse,
  HostedLyricsSearchResult,
  ImageAttribution,
  ImageQuery,
  ImageResult,
  ImageSearchQuery,
  ImageSearchSource,
  ImageSource,
  LyricsSearchQuery,
  PaginatedQuery,
  QuoteListQuery,
  SongListQuery,
  SongResponse,
  SwiftieApiClient,
  SwiftieApiFetch,
} from './client/types.js';
export { getAlbum, getAlbumWithSongs, getAllAlbums } from './offline/albums.js';
export { getAllEras, getEra } from './offline/eras.js';
export { searchLyrics } from './offline/lyrics.js';
export { getDailyQuote, getQuotes, getRandomQuote } from './offline/quotes.js';
export { getRandomSong, getSong, getSongs, searchSongs } from './offline/songs.js';

export type {
  Album,
  AlbumSlug,
  AlbumType,
  AlbumWithSongs,
  ApiEnvelope,
  CoverArt,
  CoverArtSources,
  Era,
  EraDetail,
  ErrorEnvelope,
  ListAlbumsFilter,
  ListQuotesFilter,
  ListSongsFilter,
  LyricLine,
  LyricMatch,
  LyricSearchResult,
  LyricSection,
  Lyrics,
  MusicVideo,
  PaginatedMeta,
  PaginatedResult,
  Quote,
  SearchLyricsOptions,
  Song,
  SongMeta,
  TaylorsVersion,
  TaylorsVersionStatus,
} from './shared/types.js';
