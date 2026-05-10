import { Injectable } from '@nestjs/common';
// biome-ignore lint/style/useImportType: NestJS requires this at runtime for DI
import { ConfigService } from '@nestjs/config';
import type { Env } from './env.schema';

export interface SpotifyCredentials {
  clientId: string;
  clientSecret: string;
}

export interface PexelsCredentials {
  apiKey: string;
}

export interface UnsplashCredentials {
  accessKey: string;
}

export interface RedditCredentials {
  clientId: string;
  clientSecret: string;
  userAgent: string;
}

export interface ProviderCredentials {
  spotify: SpotifyCredentials | null;
  pexels: PexelsCredentials | null;
  unsplash: UnsplashCredentials | null;
  reddit: RedditCredentials | null;
}

@Injectable()
export class AppConfigService {
  constructor(private readonly nestConfig: ConfigService<Env, true>) {}

  get<K extends keyof Env>(key: K): Env[K] {
    return this.nestConfig.get(key, { infer: true });
  }

  get isProduction(): boolean {
    return this.get('NODE_ENV') === 'production';
  }

  get isDevelopment(): boolean {
    return this.get('NODE_ENV') === 'development';
  }

  get isTest(): boolean {
    return this.get('NODE_ENV') === 'test';
  }

  get providers(): ProviderCredentials {
    const spotifyId = this.get('SPOTIFY_CLIENT_ID');
    const spotifySecret = this.get('SPOTIFY_CLIENT_SECRET');
    const pexelsKey = this.get('PEXELS_API_KEY');
    const unsplashKey = this.get('UNSPLASH_ACCESS_KEY');
    const redditId = this.get('REDDIT_CLIENT_ID');
    const redditSecret = this.get('REDDIT_CLIENT_SECRET');
    const redditUa = this.get('REDDIT_USER_AGENT');

    return {
      spotify:
        spotifyId && spotifySecret ? { clientId: spotifyId, clientSecret: spotifySecret } : null,
      pexels: pexelsKey ? { apiKey: pexelsKey } : null,
      unsplash: unsplashKey ? { accessKey: unsplashKey } : null,
      reddit:
        redditId && redditSecret && redditUa
          ? { clientId: redditId, clientSecret: redditSecret, userAgent: redditUa }
          : null,
    };
  }
}
