import { Injectable } from '@nestjs/common';
import { AppConfigService } from '../../../config/config.service';
import { LruCacheService } from '../cache/lru-cache.service';
import { HttpClient } from '../http/http.client';
import { IMAGES_USER_AGENT } from '../http/user-agent';
import type { ImageProvider, ImageQueryContext, ImageResult } from './image-provider.interface';

const UNSPLASH_SEARCH = 'https://api.unsplash.com/search/photos';
const RESPONSE_TTL_MS = 15 * 60_000;
const UTM = 'utm_source=swiftie-api&utm_medium=referral';

interface UnsplashUser {
  name: string;
  username: string;
  links?: { html?: string };
}
interface UnsplashPhoto {
  id: string;
  width: number;
  height: number;
  color?: string;
  blur_hash?: string;
  description?: string | null;
  alt_description?: string | null;
  urls: { raw: string; full: string; regular: string; small: string; thumb: string };
  links: { html: string };
  user: UnsplashUser;
}
interface UnsplashSearchResponse {
  results: UnsplashPhoto[];
}

function appendUtm(url: string): string {
  return url.includes('?') ? `${url}&${UTM}` : `${url}?${UTM}`;
}

@Injectable()
export class UnsplashProvider implements ImageProvider {
  readonly id = 'unsplash';
  readonly missingEnv = ['UNSPLASH_ACCESS_KEY'] as const;
  readonly supportsSearch = true;

  private readonly http = new HttpClient({ userAgent: IMAGES_USER_AGENT });

  constructor(
    private readonly config: AppConfigService,
    private readonly cache: LruCacheService,
  ) {}

  isAvailable(): boolean {
    return this.config.providers.unsplash !== null;
  }

  async fetch(ctx: ImageQueryContext): Promise<ImageResult[]> {
    const creds = this.config.providers.unsplash;
    if (!creds) return [];
    const query = (ctx.query ?? '').trim();
    if (!query) return [];

    const cacheKey = `${query.toLowerCase()}:${ctx.limit}`;
    const cached = this.cache.get<ImageResult[]>(this.id, cacheKey);
    if (cached) return cached;

    const url = `${UNSPLASH_SEARCH}?query=${encodeURIComponent(query)}&per_page=${ctx.limit}`;
    const data = await this.http.request<UnsplashSearchResponse>(url, {
      headers: { Authorization: `Client-ID ${creds.accessKey}` },
    });

    const results = data.results.map((p) => this.toResult(p));
    this.cache.set(this.id, cacheKey, results, RESPONSE_TTL_MS);
    return results;
  }

  private toResult(p: UnsplashPhoto): ImageResult {
    const userProfile = p.user.links?.html ?? `https://unsplash.com/@${p.user.username}`;
    return {
      url: p.urls.regular,
      thumbnailUrl: p.urls.small,
      width: p.width,
      height: p.height,
      source: this.id,
      sourceUrl: appendUtm(p.links.html),
      attribution: {
        author: p.user.name,
        authorUrl: appendUtm(userProfile),
        license: 'Unsplash License',
        licenseUrl: 'https://unsplash.com/license',
      },
      meta: {
        id: p.id,
        description: p.description ?? p.alt_description ?? undefined,
        color: p.color,
        blurHash: p.blur_hash,
        provider: { name: 'Unsplash', url: appendUtm('https://unsplash.com') },
      },
    };
  }
}
