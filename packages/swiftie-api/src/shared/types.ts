/**
 * Public type surface for swiftie-api.
 *
 * Hand-rolled to match the JSON schemas in `@swiftie-api/data` exactly, but
 * without importing zod. This keeps the published `.d.ts` files free of any
 * `import * as z from "zod"` references, so end users don't acquire zod as a
 * phantom type dependency.
 *
 * Structural parity with the data package is enforced at build time by
 * `test/types-drift.spec.ts`.
 */

export type AlbumSlug =
  | '1989'
  | '1989-tv'
  | 'debut'
  | 'evermore'
  | 'fearless'
  | 'fearless-tv'
  | 'folklore'
  | 'life-of-a-showgirl'
  | 'lover'
  | 'midnights'
  | 'red'
  | 'red-tv'
  | 'reputation'
  | 'speak-now'
  | 'speak-now-tv'
  | 'tortured-poets-department';

export type AlbumType = 'studio' | 'taylors_version' | 'ep' | 'compilation';

export type TaylorsVersionStatus = 'released' | 'unreleased' | 'not_applicable';

export interface TaylorsVersion {
  status: TaylorsVersionStatus;
  originalAlbumSlug?: string;
  taylorsVersionAlbumSlug?: string;
}

export interface CoverArtSources {
  coverArtArchive?: string;
  spotify?: string;
  manual?: string;
}

export interface CoverArt {
  primary: string;
  sources: CoverArtSources;
}

export interface Album {
  slug: string;
  title: string;
  subtitle?: string;
  type: AlbumType;
  era: string;
  releaseDate: string;
  producers: string[];
  writers: string[];
  label: string;
  totalTracks: number;
  durationSeconds?: number;
  taylorsVersion: TaylorsVersion;
  musicbrainzReleaseGroupId?: string;
  spotifyAlbumId?: string;
  coverArt: CoverArt;
  description: string;
  trivia: string[];
}

export type LyricLine = string;

export interface LyricSection {
  name: string;
  lines: LyricLine[];
}

export interface Lyrics {
  sections: LyricSection[];
}

export interface MusicVideo {
  title: string;
  director: string[];
  releaseDate: string;
  runtimeSeconds: number;
  youtubeUrl?: string;
  vimeoUrl?: string;
}

export interface Song {
  slug: string;
  title: string;
  albumSlug: string;
  trackNumber: number;
  discNumber: number;
  durationSeconds: number;
  writers: string[];
  producers: string[];
  features: string[];
  isVaultTrack: boolean;
  isBonusTrack: boolean;
  isPromotionalRelease: boolean;
  releaseDate?: string;
  musicbrainzRecordingId?: string;
  spotifyTrackId?: string;
  isrc?: string;
  musicVideo?: MusicVideo;
  moods: string[];
  themes: string[];
  lyrics: Lyrics;
  credits?: string;
}

/**
 * `Song` minus the `lyrics` payload. Returned by sync offline APIs
 * (`getSong`, `getSongs`, `searchSongs`, `getRandomSong`) which read from
 * the inlined metadata bundle. To access lyrics, call
 * `getAlbumWithSongs(slug)` or import the per-album subpath module.
 */
export type SongMeta = Omit<Song, 'lyrics'>;

export interface AlbumWithSongs extends Album {
  songs: Song[];
}

export interface Quote {
  id: string;
  text: string;
  songSlug: string;
  albumSlug: string;
  section?: string;
  lineNumbers?: number[];
  mood?: string;
  featured: boolean;
}

export interface Era {
  slug: string;
  name: string;
  displayName: string;
  color: string;
  description: string;
  startDate: string;
  endDate: string | null;
  albumSlugs: string[];
  iconographyKeywords: string[];
}

export interface EraDetail extends Era {
  albums: Album[];
}

export interface ListAlbumsFilter {
  era?: string;
  type?: AlbumType;
  taylorsVersion?: TaylorsVersionStatus;
  includeTaylorsVersions?: boolean;
}

export interface ListSongsFilter {
  albumSlug?: string;
  isVaultTrack?: boolean;
  isBonusTrack?: boolean;
  feature?: string;
  includeTaylorsVersions?: boolean;
}

export interface ListQuotesFilter {
  albumSlug?: string;
  songSlug?: string;
  mood?: string;
  featured?: boolean;
}

export interface LyricMatch {
  term: string;
  ranges: Array<[number, number]>;
}

export interface LyricSearchResult {
  id: string;
  songSlug: string;
  albumSlug: string;
  songTitle: string;
  section: string;
  lineNumber: number;
  text: string;
  score: number;
  matches: LyricMatch[];
}

export interface SearchLyricsOptions {
  limit?: number;
}

export interface PaginatedMeta {
  total: number;
  limit: number;
  offset: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginatedMeta;
}
