import { Injectable } from '@nestjs/common';
import { AppConfigService } from '../../../config/config.service';
import { LruCacheService } from '../cache/lru-cache.service';
import { HttpClient } from '../http/http.client';
import { IMAGES_USER_AGENT } from '../http/user-agent';
import { ClientCredentialsTokenCache } from './client-credentials-token-cache';
import type { ImageProvider, ImageQueryContext, ImageResult } from './image-provider.interface';

const SPOTIFY_API = 'https://api.spotify.com/v1';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const RESPONSE_TTL_MS = 5 * 60_000;
const LICENSE_URL = 'https://developer.spotify.com/terms';

interface SpotifyImage {
  url: string;
  width?: number;
  height?: number;
}
interface SpotifyAlbum {
  id: string;
  name: string;
  images: SpotifyImage[];
  external_urls?: { spotify?: string };
}
interface SpotifySearch {
  albums: { items: SpotifyAlbum[] };
}

@Injectable()
export class SpotifyProvider implements ImageProvider {
  readonly id = 'spotify';
  readonly missingEnv = ['SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET'] as const;
  readonly supportsSearch = false;

  private readonly http = new HttpClient({ userAgent: IMAGES_USER_AGENT });
  private tokens: ClientCredentialsTokenCache | null = null;

  constructor(
    private readonly config: AppConfigService,
    private readonly cache: LruCacheService,
  ) {}

  isAvailable(): boolean {
    return this.config.providers.spotify !== null;
  }

  async fetch(ctx: ImageQueryContext): Promise<ImageResult[]> {
    if (!ctx.album) return [];
    const creds = this.config.providers.spotify;
    if (!creds) return [];

    const cacheKey = ctx.album.spotifyId ?? `slug:${ctx.album.slug}`;
    let album = this.cache.get<SpotifyAlbum>(this.id, cacheKey);
    if (!album) {
      const fetched = await this.lookupAlbum(ctx.album);
      if (!fetched) return [];
      album = fetched;
      this.cache.set(this.id, cacheKey, album, RESPONSE_TTL_MS);
    }

    const resolvedAlbum = album;
    const sorted = [...resolvedAlbum.images].sort((a, b) => (b.width ?? 0) - (a.width ?? 0));
    return sorted.slice(0, ctx.limit).map((img) => this.toResult(img, resolvedAlbum));
  }

  private async lookupAlbum(
    album: NonNullable<ImageQueryContext['album']>,
  ): Promise<SpotifyAlbum | null> {
    if (album.spotifyId) {
      return this.spotifyGet<SpotifyAlbum>(`/albums/${album.spotifyId}`).catch(() => null);
    }
    const escapedTitle = album.title.replaceAll('"', String.raw`\"`);
    const q = encodeURIComponent(`album:"${escapedTitle}" artist:"taylor swift"`);
    const search = await this.spotifyGet<SpotifySearch>(`/search?q=${q}&type=album&limit=10`).catch(
      () => null,
    );
    return search?.albums.items[0] ?? null;
  }

  private async spotifyGet<T>(path: string): Promise<T> {
    const token = await this.getTokenCache().getToken();
    return this.http.request<T>(`${SPOTIFY_API}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  private getTokenCache(): ClientCredentialsTokenCache {
    if (this.tokens) return this.tokens;
    const creds = this.config.providers.spotify;
    if (!creds) throw new Error('Spotify credentials missing');
    this.tokens = new ClientCredentialsTokenCache({
      tokenUrl: SPOTIFY_TOKEN_URL,
      serviceName: 'Spotify',
      clientId: creds.clientId,
      clientSecret: creds.clientSecret,
      userAgent: IMAGES_USER_AGENT,
    });
    return this.tokens;
  }

  private toResult(img: SpotifyImage, album: SpotifyAlbum): ImageResult {
    const openUrl = album.external_urls?.spotify ?? `https://open.spotify.com/album/${album.id}`;
    return {
      url: img.url,
      width: img.width,
      height: img.height,
      source: this.id,
      sourceUrl: openUrl,
      attribution: {
        author: 'Spotify',
        authorUrl: 'https://open.spotify.com',
        license: 'Spotify Developer Terms',
        licenseUrl: LICENSE_URL,
      },
      meta: {
        albumId: album.id,
        spotifyUri: `spotify:album:${album.id}`,
        deepLink: openUrl,
        brandRequirements: 'Display Spotify logo and deep-link to Spotify per Developer Terms.',
      },
    };
  }
}
