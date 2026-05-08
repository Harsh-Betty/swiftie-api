import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Album, Song } from '../../../packages/data/src/schemas';
import { REPO_ROOT } from '../io';
import type { Logger } from '../logger';
import type { AdapterContext, DataSourceAdapter } from './adapter';

const MB_BASE = 'https://musicbrainz.org/ws/2';
const MIN_INTERVAL_MS = 1100;

let userAgentCache: string | null = null;

async function getUserAgent(): Promise<string> {
  if (userAgentCache) return userAgentCache;
  const pkg = JSON.parse(await readFile(join(REPO_ROOT, 'packages/data/package.json'), 'utf8')) as {
    version?: string;
  };
  const version = pkg.version ?? '0.0.0';
  userAgentCache = `swiftie-api/${version} (+https://github.com/Harsh-Betty/swiftie-api)`;
  return userAgentCache;
}

let lastCallAt = 0;
let queueTail: Promise<unknown> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const next = queueTail.then(async () => {
    const wait = Math.max(0, MIN_INTERVAL_MS - (Date.now() - lastCallAt));
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    try {
      return await task();
    } finally {
      lastCallAt = Date.now();
    }
  });
  queueTail = next.catch(() => undefined);
  return next;
}

async function mbFetch<T>(path: string, logger: Logger): Promise<T> {
  return enqueue(async () => {
    const ua = await getUserAgent();
    const url = `${MB_BASE}${path}`;
    logger.debug({ url }, 'musicbrainz GET');
    const res = await fetch(url, {
      headers: { 'User-Agent': ua, Accept: 'application/json' },
    });
    if (!res.ok) {
      throw new Error(`MusicBrainz ${res.status} ${res.statusText} for ${path}`);
    }
    return (await res.json()) as T;
  });
}

interface MBLabelInfo {
  label?: { name?: string } | null;
}
interface MBMedium {
  'track-count'?: number;
  tracks?: MBTrack[];
}
interface MBTrack {
  id?: string;
  position?: number;
  number?: string;
  title?: string;
  recording?: {
    id?: string;
    title?: string;
    length?: number | null;
    isrcs?: string[];
  };
}
interface MBRelease {
  id: string;
  title?: string;
  date?: string;
  status?: string | null;
  country?: string | null;
  'label-info'?: MBLabelInfo[];
  media?: MBMedium[];
  packaging?: string | null;
}
interface MBReleaseGroupResponse {
  id: string;
  title: string;
  'first-release-date'?: string;
  releases?: MBRelease[];
}

function pickCanonicalRelease(releases: MBRelease[] | undefined): MBRelease | null {
  if (!releases || releases.length === 0) return null;
  const official = releases.filter((r) => (r.status ?? '').toLowerCase() === 'official');
  const pool = official.length > 0 ? official : releases;
  const sorted = [...pool].sort((a, b) => {
    const ad = a.date ?? '';
    const bd = b.date ?? '';
    if (ad && bd) return ad.localeCompare(bd);
    if (ad) return -1;
    if (bd) return 1;
    return 0;
  });
  return sorted[0] ?? null;
}

const releaseLookupCache = new Map<string, Promise<MBRelease | null>>();

async function lookupRelease(releaseId: string, logger: Logger): Promise<MBRelease | null> {
  const cached = releaseLookupCache.get(releaseId);
  if (cached) return cached;
  const promise = (async () => {
    try {
      return await mbFetch<MBRelease>(
        `/release/${releaseId}?inc=recordings+isrcs+labels&fmt=json`,
        logger,
      );
    } catch (err) {
      logger.warn({ err: (err as Error).message, releaseId }, 'musicbrainz release lookup failed');
      return null;
    }
  })();
  releaseLookupCache.set(releaseId, promise);
  return promise;
}

const albumReleaseIdCache = new Map<string, string | null>();

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replaceAll("(taylor's version)", '')
    .replaceAll('(taylors version)', '')
    .replaceAll('(from the vault)', '')
    .replaceAll(/\s+/g, ' ')
    .trim();
}

export const musicbrainzAdapter: DataSourceAdapter = {
  id: 'musicbrainz',
  displayName: 'MusicBrainz',
  isAvailable() {
    return true;
  },

  async enrichAlbum(album: Album, ctx: AdapterContext): Promise<Partial<Album>> {
    const mbid = album.musicbrainzReleaseGroupId;
    if (!mbid) {
      ctx.logger.debug({ album: album.slug }, 'musicbrainz: no MBID, skipping album');
      return {};
    }

    let response: MBReleaseGroupResponse;
    try {
      response = await mbFetch<MBReleaseGroupResponse>(
        `/release-group/${mbid}?inc=releases+artist-credits&fmt=json`,
        ctx.logger,
      );
    } catch (err) {
      ctx.logger.warn(
        { err: (err as Error).message, album: album.slug },
        'musicbrainz release-group lookup failed',
      );
      return {};
    }

    const canonical = pickCanonicalRelease(response.releases);
    albumReleaseIdCache.set(album.slug, canonical?.id ?? null);

    const partial: Partial<Album> = {};
    if (response['first-release-date']) {
      const date = response['first-release-date'];
      const isoDate = /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;
      if (isoDate) partial.releaseDate = isoDate;
    }
    if (canonical) {
      const trackCount = (canonical.media ?? []).reduce(
        (sum, m) => sum + (m['track-count'] ?? 0),
        0,
      );
      if (trackCount > 0) partial.totalTracks = trackCount;

      // label-info isn't included on release-group's nested release stubs, so
      // fetch the canonical release with inc=labels (cached for song enrichment).
      const releaseDetail = await lookupRelease(canonical.id, ctx.logger);
      const labelName = releaseDetail?.['label-info']?.[0]?.label?.name;
      if (labelName) partial.label = labelName;
    }
    return partial;
  },

  async enrichSong(song: Song, album: Album, ctx: AdapterContext): Promise<Partial<Song>> {
    if (!album.musicbrainzReleaseGroupId) return {};

    let releaseId = albumReleaseIdCache.get(album.slug);
    if (releaseId === undefined) {
      try {
        const rg = await mbFetch<MBReleaseGroupResponse>(
          `/release-group/${album.musicbrainzReleaseGroupId}?inc=releases&fmt=json`,
          ctx.logger,
        );
        const canonical = pickCanonicalRelease(rg.releases);
        releaseId = canonical?.id ?? null;
        albumReleaseIdCache.set(album.slug, releaseId);
      } catch (err) {
        ctx.logger.warn(
          { err: (err as Error).message, album: album.slug },
          'musicbrainz release-group resolve failed',
        );
        albumReleaseIdCache.set(album.slug, null);
        return {};
      }
    }
    if (!releaseId) return {};

    const release = await lookupRelease(releaseId, ctx.logger);
    if (!release) return {};

    const target = normalizeTitle(song.title);
    let match: MBTrack | null = null;
    for (const medium of release.media ?? []) {
      for (const track of medium.tracks ?? []) {
        const trackPos = track.position ?? Number.parseInt(track.number ?? '0', 10);
        const titleMatch = normalizeTitle(track.title ?? track.recording?.title ?? '') === target;
        if (titleMatch && trackPos === song.trackNumber) {
          match = track;
          break;
        }
      }
      if (match) break;
    }
    if (!match) {
      for (const medium of release.media ?? []) {
        for (const track of medium.tracks ?? []) {
          if (normalizeTitle(track.title ?? track.recording?.title ?? '') === target) {
            match = track;
            break;
          }
        }
        if (match) break;
      }
    }
    if (!match?.recording) return {};

    const partial: Partial<Song> = {};
    if (match.recording.id) partial.musicbrainzRecordingId = match.recording.id;
    const isrc = match.recording.isrcs?.[0];
    if (isrc) partial.isrc = isrc;
    if (typeof match.recording.length === 'number' && match.recording.length > 0) {
      partial.durationSeconds = Math.round(match.recording.length / 1000);
    }
    return partial;
  },
};
