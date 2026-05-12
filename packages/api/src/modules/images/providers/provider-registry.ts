import type { FactoryProvider } from '@nestjs/common';
import { CoverArtArchiveProvider } from './cover-art-archive.provider';
import type { ImageProvider } from './image-provider.interface';
import { PexelsProvider } from './pexels.provider';
import { RedditProvider } from './reddit.provider';
import { SpotifyProvider } from './spotify.provider';
import { UnsplashProvider } from './unsplash.provider';

export const IMAGE_PROVIDERS = Symbol('IMAGE_PROVIDERS');

export type ImageProviderRegistry = ReadonlyMap<string, ImageProvider>;

export const IMAGE_PROVIDER_CLASSES = [
  CoverArtArchiveProvider,
  SpotifyProvider,
  PexelsProvider,
  UnsplashProvider,
  RedditProvider,
] as const;

export const AUTO_SOURCE_PRIORITY = [
  'cover-art-archive',
  'spotify',
  'pexels',
  'unsplash',
  'reddit',
] as const;

export const imageProvidersFactory: FactoryProvider<ImageProviderRegistry> = {
  provide: IMAGE_PROVIDERS,
  useFactory: (...providers: ImageProvider[]): ImageProviderRegistry =>
    new Map(providers.map((p) => [p.id, p])),
  inject: [...IMAGE_PROVIDER_CLASSES],
};
