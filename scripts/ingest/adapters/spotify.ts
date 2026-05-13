import { join } from 'node:path';
import type { Album, Song } from '../../../packages/data/src/schemas';
import type { IngestEnv } from '../env';
import { REPO_ROOT, readJsonCache, writeJsonCache } from '../io';
import type { Logger } from '../logger';
import { type SongSeed, slugifySongTitle } from '../song-seed';
import type { AdapterContext, DataSourceAdapter } from './adapter';

const SPOTIFY_API = 'https://api.spotify.com/v1';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const CACHE_PATH = join(REPO_ROOT, '.ingest-cache.json');
const TOKEN_REFRESH_LEEWAY_MS = 60_000;

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}
interface CacheFile {
  spotify?: CachedToken;
}

interface SpotifyImage {
  url: string;
  width?: number;
  height?: number;
}
interface SpotifyTrack {
  id: string;
  name: string;
  track_number: number;
  disc_number: number;
  duration_ms: number;
  external_ids?: { isrc?: string };
}
interface SpotifyAlbumResponse {
  id: string;
  name: string;
  release_date: string;
  total_tracks: number;
  images: SpotifyImage[];
  tracks: { items: SpotifyTrack[]; next: string | null };
}
interface SpotifyTracksPage {
  items: SpotifyTrack[];
  next: string | null;
}
interface SpotifySearchResponse {
  albums: { items: SpotifyAlbumResponse[] };
}

let cachedToken: CachedToken | null = null;
let inflightToken: Promise<string> | null = null;

async function getAccessToken(env: IngestEnv, logger: Logger): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt - TOKEN_REFRESH_LEEWAY_MS > now) {
    return cachedToken.accessToken;
  }
  if (!cachedToken) {
    const cache = await readJsonCache<CacheFile>(CACHE_PATH);
    if (cache?.spotify && cache.spotify.expiresAt - TOKEN_REFRESH_LEEWAY_MS > now) {
      cachedToken = cache.spotify;
      return cachedToken.accessToken;
    }
  }
  if (inflightToken) return inflightToken;

  inflightToken = (async () => {
    const id = env.SPOTIFY_CLIENT_ID;
    const secret = env.SPOTIFY_CLIENT_SECRET;
    if (!id || !secret) throw new Error('SPOTIFY_CLIENT_ID/SECRET missing');
    const credentials = Buffer.from(`${id}:${secret}`).toString('base64');
    logger.debug('spotify: requesting client-credentials token');
    const res = await fetch(SPOTIFY_TOKEN_URL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    if (!res.ok) {
      throw new Error(`Spotify token endpoint ${res.status} ${res.statusText}`);
    }
    const json = (await res.json()) as { access_token: string; expires_in: number };
    const token: CachedToken = {
      accessToken: json.access_token,
      expiresAt: Date.now() + json.expires_in * 1000,
    };
    cachedToken = token;
    const existing = (await readJsonCache<CacheFile>(CACHE_PATH)) ?? {};
    existing.spotify = token;
    await writeJsonCache(CACHE_PATH, existing);
    return token.accessToken;
  })();

  try {
    return await inflightToken;
  } finally {
    inflightToken = null;
  }
}

async function spotifyFetch<T>(
  path: string,
  env: IngestEnv,
  logger: Logger,
  attempt = 0,
): Promise<T | null> {
  const token = await getAccessToken(env, logger);
  const url = path.startsWith('http') ? path : `${SPOTIFY_API}${path}`;
  logger.debug({ url }, 'spotify GET');
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401 && attempt === 0) {
    cachedToken = null;
    return spotifyFetch<T>(path, env, logger, attempt + 1);
  }
  if (res.status === 429 && attempt < 2) {
    const retryAfter = Number.parseInt(res.headers.get('retry-after') ?? '1', 10);
    const waitMs = Math.max(1000, (Number.isFinite(retryAfter) ? retryAfter : 1) * 1000);
    logger.warn({ url, waitMs }, 'spotify 429, backing off');
    await new Promise((r) => setTimeout(r, waitMs));
    return spotifyFetch<T>(path, env, logger, attempt + 1);
  }
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Spotify ${res.status} ${res.statusText} for ${url}`);
  }
  return (await res.json()) as T;
}

const albumResponseCache = new Map<string, SpotifyAlbumResponse | null>();

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replaceAll("(taylor's version)", '')
    .replaceAll('(taylors version)', '')
    .replaceAll('(from the vault)', '')
    .replaceAll(/\s+/g, ' ')
    .trim();
}

async function findAlbumBySearch(
  album: Album,
  env: IngestEnv,
  logger: Logger,
): Promise<SpotifyAlbumResponse | null> {
  const q = encodeURIComponent(`album:${album.title} artist:taylor swift`);
  const search = await spotifyFetch<SpotifySearchResponse>(
    `/search?q=${q}&type=album&limit=10`,
    env,
    logger,
  );
  if (!search) return null;

  const targetYear = album.releaseDate.slice(0, 4);
  const candidate = search.albums.items.find(
    (a) => a.release_date.startsWith(targetYear) && a.total_tracks === album.totalTracks,
  );
  const chosen = candidate ?? null;
  if (!chosen) {
    logger.warn(
      { album: album.slug, candidateCount: search.albums.items.length },
      'spotify: no matching album from search',
    );
    return null;
  }
  return spotifyFetch<SpotifyAlbumResponse>(`/albums/${chosen.id}`, env, logger);
}

async function loadAlbumResponse(
  album: Album,
  env: IngestEnv,
  logger: Logger,
): Promise<SpotifyAlbumResponse | null> {
  if (albumResponseCache.has(album.slug)) {
    return albumResponseCache.get(album.slug) ?? null;
  }
  let response: SpotifyAlbumResponse | null = null;
  try {
    if (album.spotifyAlbumId) {
      response = await spotifyFetch<SpotifyAlbumResponse>(
        `/albums/${album.spotifyAlbumId}`,
        env,
        logger,
      );
    } else {
      response = await findAlbumBySearch(album, env, logger);
    }
  } catch (err) {
    logger.warn({ err: (err as Error).message, album: album.slug }, 'spotify album lookup failed');
    response = null;
  }
  albumResponseCache.set(album.slug, response);
  return response;
}

async function loadAlbumTracks(
  album: Album,
  env: IngestEnv,
  logger: Logger,
): Promise<SpotifyTrack[]> {
  const response = await loadAlbumResponse(album, env, logger);
  if (!response) return [];

  const tracks = [...response.tracks.items];
  let next = response.tracks.next;
  while (next) {
    const page = await spotifyFetch<SpotifyTracksPage>(next, env, logger);
    if (!page) break;
    tracks.push(...page.items);
    next = page.next;
  }
  return tracks;
}

function spotifyTrackToSeed(album: Album, track: SpotifyTrack): SongSeed {
  return {
    albumSlug: album.slug,
    discNumber: track.disc_number,
    durationSeconds: Math.max(0, Math.round(track.duration_ms / 1000)),
    isrc: track.external_ids?.isrc,
    slug: slugifySongTitle(track.name),
    spotifyTrackId: track.id,
    title: track.name,
    trackNumber: track.track_number,
  };
}

export const spotifyAdapter: DataSourceAdapter = {
  id: 'spotify',
  displayName: 'Spotify',
  isAvailable(env: IngestEnv) {
    return Boolean(env.SPOTIFY_CLIENT_ID && env.SPOTIFY_CLIENT_SECRET);
  },

  async listAlbumTracks(album: Album, ctx: AdapterContext): Promise<SongSeed[]> {
    const tracks = await loadAlbumTracks(album, ctx.env, ctx.logger);
    return tracks.map((track) => spotifyTrackToSeed(album, track));
  },

  async enrichAlbum(album: Album, ctx: AdapterContext): Promise<Partial<Album>> {
    const response = await loadAlbumResponse(album, ctx.env, ctx.logger);
    if (!response) return {};

    const partial: Partial<Album> = {};
    if (response.id) partial.spotifyAlbumId = response.id;
    if (response.total_tracks > 0) partial.totalTracks = response.total_tracks;
    const image = response.images[0]?.url;
    if (image) {
      partial.coverArt = {
        primary: '',
        sources: { spotify: image },
      } as Album['coverArt'];
    }
    return partial;
  },

  async enrichSong(song: Song, album: Album, ctx: AdapterContext): Promise<Partial<Song>> {
    const response = await loadAlbumResponse(album, ctx.env, ctx.logger);
    if (!response) return {};

    const target = normalizeTitle(song.title);
    const match = response.tracks.items.find((t) => {
      if (t.track_number !== song.trackNumber) return false;
      return normalizeTitle(t.name) === target;
    });
    if (!match) return {};

    const partial: Partial<Song> = {};
    if (match.id) partial.spotifyTrackId = match.id;
    const isrc = match.external_ids?.isrc;
    if (isrc) partial.isrc = isrc;
    return partial;
  },
};
