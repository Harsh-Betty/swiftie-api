export { createClient } from './client/create-client.js';
export { SwiftieApiError } from './client/errors.js';
export type {
  AlbumListQuery,
  CreateClientOptions,
  DailyQuoteQuery,
  GetSongQuery,
  LyricsSearchQuery,
  PaginatedQuery,
  QuoteListQuery,
  SongListQuery,
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
  CoverArt,
  CoverArtSources,
  Era,
  EraDetail,
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
