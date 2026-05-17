import { Injectable } from '@nestjs/common';
import { AppConfigService, type RedditCredentials } from '../../../config/config.service';
import { LruCacheService } from '../cache/lru-cache.service';
import { HttpClient } from '../http/http.client';
import { ClientCredentialsTokenCache } from './client-credentials-token-cache';
import type { ImageProvider, ImageQueryContext, ImageResult } from './image-provider.interface';

const REDDIT_OAUTH = 'https://oauth.reddit.com';
const REDDIT_TOKEN_URL = 'https://www.reddit.com/api/v1/access_token';
const RESPONSE_TTL_MS = 5 * 60_000;
const IMAGE_EXT = /\.(jpe?g|png|gif|webp)(\?.*)?$/i;

interface RedditPreviewImage {
  source: { url: string; width: number; height: number };
  resolutions: Array<{ url: string; width: number; height: number }>;
}
interface RedditPost {
  url: string;
  permalink: string;
  author: string;
  subreddit: string;
  title: string;
  score: number;
  preview?: { images?: RedditPreviewImage[] };
}
interface RedditListing {
  data: { children: Array<{ data: RedditPost }> };
}

@Injectable()
export class RedditProvider implements ImageProvider {
  readonly id = 'reddit';
  readonly missingEnv = ['REDDIT_CLIENT_ID', 'REDDIT_CLIENT_SECRET', 'REDDIT_USER_AGENT'] as const;
  readonly supportsSearch = true;

  private tokens: ClientCredentialsTokenCache | null = null;
  // Reddit requires a per-deployment user-agent (from creds), so the HttpClient is built lazily.
  private http: HttpClient | null = null;

  constructor(
    private readonly config: AppConfigService,
    private readonly cache: LruCacheService,
  ) {}

  isAvailable(): boolean {
    return this.config.providers.reddit !== null;
  }

  async fetch(ctx: ImageQueryContext): Promise<ImageResult[]> {
    const creds = this.config.providers.reddit;
    if (!creds) return [];
    const query = (ctx.query ?? '').trim();
    if (!query) return [];

    const cacheKey = `${query.toLowerCase()}:${ctx.limit}`;
    const cached = this.cache.get<ImageResult[]>(this.id, cacheKey);
    if (cached) return cached;

    const subs = creds.subreddits.join('+');
    const token = await this.getTokens(creds).getToken();
    const url =
      `${REDDIT_OAUTH}/r/${subs}/search` +
      `?q=${encodeURIComponent(query)}&restrict_sr=1&type=link&sort=top&limit=${ctx.limit}`;

    const data = await this.getHttp(creds.userAgent).request<RedditListing>(url, {
      headers: { Authorization: `bearer ${token}` },
    });

    const results = data.data.children
      .map((c) => this.toResult(c.data))
      .filter((r): r is ImageResult => r !== null)
      .slice(0, ctx.limit);

    this.cache.set(this.id, cacheKey, results, RESPONSE_TTL_MS);
    return results;
  }

  private toResult(post: RedditPost): ImageResult | null {
    let imageUrl: string | null = null;
    let width: number | undefined;
    let height: number | undefined;

    if (IMAGE_EXT.test(post.url)) {
      imageUrl = post.url;
    }
    const previewSource = post.preview?.images?.[0]?.source;
    if (!imageUrl && previewSource) {
      imageUrl = previewSource.url.replaceAll('&amp;', '&');
      width = previewSource.width;
      height = previewSource.height;
    } else if (previewSource) {
      width = previewSource.width;
      height = previewSource.height;
    }
    if (!imageUrl) return null;

    const resolutions = post.preview?.images?.[0]?.resolutions ?? [];
    const thumbCandidate =
      resolutions.find((r) => r.width >= 500 && r.width <= 800) ?? resolutions.at(-1);

    return {
      url: imageUrl,
      thumbnailUrl: thumbCandidate?.url.replaceAll('&amp;', '&'),
      width,
      height,
      source: this.id,
      sourceUrl: `https://reddit.com${post.permalink}`,
      attribution: {
        author: `u/${post.author}`,
        authorUrl: `https://reddit.com/user/${post.author}`,
        license: 'User-generated content (Reddit) — verify rights before redistributing',
      },
      meta: { subreddit: post.subreddit, score: post.score, title: post.title },
    };
  }

  private getTokens(creds: RedditCredentials): ClientCredentialsTokenCache {
    if (this.tokens) return this.tokens;
    this.tokens = new ClientCredentialsTokenCache({
      tokenUrl: REDDIT_TOKEN_URL,
      serviceName: 'Reddit',
      clientId: creds.clientId,
      clientSecret: creds.clientSecret,
      userAgent: creds.userAgent,
    });
    return this.tokens;
  }

  private getHttp(userAgent: string): HttpClient {
    if (this.http) return this.http;
    this.http = new HttpClient({ userAgent });
    return this.http;
  }
}
