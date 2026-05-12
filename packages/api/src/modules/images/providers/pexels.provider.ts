import { Injectable } from '@nestjs/common';
import { AppConfigService } from '../../../config/config.service';
import { LruCacheService } from '../cache/lru-cache.service';
import { HttpClient } from '../http/http.client';
import { IMAGES_USER_AGENT } from '../http/user-agent';
import type { ImageProvider, ImageQueryContext, ImageResult } from './image-provider.interface';

const PEXELS_SEARCH = 'https://api.pexels.com/v1/search';
const RESPONSE_TTL_MS = 15 * 60_000;

interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  alt?: string;
  avg_color?: string;
  src: { large2x: string; medium: string; original: string; small: string };
}
interface PexelsSearchResponse {
  photos: PexelsPhoto[];
}

@Injectable()
export class PexelsProvider implements ImageProvider {
  readonly id = 'pexels';
  readonly missingEnv = ['PEXELS_API_KEY'] as const;
  readonly supportsSearch = true;

  private readonly http = new HttpClient({ userAgent: IMAGES_USER_AGENT });

  constructor(
    private readonly config: AppConfigService,
    private readonly cache: LruCacheService,
  ) {}

  isAvailable(): boolean {
    return this.config.providers.pexels !== null;
  }

  async fetch(ctx: ImageQueryContext): Promise<ImageResult[]> {
    const creds = this.config.providers.pexels;
    if (!creds) return [];
    const query = (ctx.query ?? '').trim();
    if (!query) return [];

    const cacheKey = `${query.toLowerCase()}:${ctx.limit}`;
    const cached = this.cache.get<ImageResult[]>(this.id, cacheKey);
    if (cached) return cached;

    const url = `${PEXELS_SEARCH}?query=${encodeURIComponent(query)}&per_page=${ctx.limit}`;
    const data = await this.http.request<PexelsSearchResponse>(url, {
      headers: { Authorization: creds.apiKey },
    });

    const results = data.photos.map((p) => this.toResult(p));
    this.cache.set(this.id, cacheKey, results, RESPONSE_TTL_MS);
    return results;
  }

  private toResult(p: PexelsPhoto): ImageResult {
    return {
      url: p.src.large2x,
      thumbnailUrl: p.src.medium,
      width: p.width,
      height: p.height,
      source: this.id,
      sourceUrl: p.url,
      attribution: {
        author: p.photographer,
        authorUrl: p.photographer_url,
        license: 'Pexels License (free for commercial & personal use)',
        licenseUrl: 'https://www.pexels.com/license/',
      },
      meta: {
        id: p.id,
        alt: p.alt,
        avgColor: p.avg_color,
        provider: { name: 'Pexels', url: 'https://www.pexels.com' },
      },
    };
  }
}
