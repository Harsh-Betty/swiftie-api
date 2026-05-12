import {
  BadRequestException,
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AlbumsService } from '../albums/albums.service';
import { SongsService } from '../songs/songs.service';
import {
  ImageSourceEnum,
  type ResolvableImageSource,
  SOURCE_TO_PROVIDER_ID,
} from './dto/image-query.dto';
import type {
  ImageProvider,
  ImageQueryContext,
  ImageResult,
} from './providers/image-provider.interface';
import {
  AUTO_SOURCE_PRIORITY,
  IMAGE_PROVIDERS,
  type ImageProviderRegistry,
} from './providers/provider-registry';

@Injectable()
export class ImagesService {
  constructor(
    @Inject(IMAGE_PROVIDERS) private readonly providers: ImageProviderRegistry,
    private readonly albums: AlbumsService,
    private readonly songs: SongsService,
  ) {}

  async forAlbum(slug: string, source: ImageSourceEnum, limit: number): Promise<ImageResult[]> {
    const album = await this.albums.findOne(slug);
    const ctx: ImageQueryContext = {
      album: {
        slug: album.slug,
        title: album.title,
        mbid: album.musicbrainzReleaseGroupId,
        spotifyId: album.spotifyAlbumId,
      },
      query: `${album.title} taylor swift`,
      limit,
    };
    return this.dispatch(source, ctx);
  }

  async forSong(slug: string, source: ImageSourceEnum, limit: number): Promise<ImageResult[]> {
    const song = await this.songs.findOne(slug, false);
    const album = await this.albums.findOne(song.albumSlug);
    const ctx: ImageQueryContext = {
      album: {
        slug: album.slug,
        title: album.title,
        mbid: album.musicbrainzReleaseGroupId,
        spotifyId: album.spotifyAlbumId,
      },
      song: { slug: song.slug, title: song.title },
      query: `${song.title} taylor swift`,
      limit,
    };
    return this.dispatch(source, ctx);
  }

  async search(query: string, source: ImageSourceEnum, limit: number): Promise<ImageResult[]> {
    if (source === ImageSourceEnum.Auto) {
      throw new BadRequestException(
        '"source=auto" is not supported on /search. Pick pexels, unsplash, or reddit.',
      );
    }
    const provider = this.requireProvider(source);
    if (!provider.supportsSearch) {
      throw new BadRequestException(
        `Image source "${source}" does not support free-form search. Use pexels, unsplash, or reddit.`,
      );
    }
    return provider.fetch({ query, limit });
  }

  private async dispatch(source: ImageSourceEnum, ctx: ImageQueryContext): Promise<ImageResult[]> {
    if (source === ImageSourceEnum.Auto) {
      for (const id of AUTO_SOURCE_PRIORITY) {
        const provider = this.providers.get(id);
        if (!provider?.isAvailable()) continue;
        const results = await provider.fetch(ctx).catch(() => [] as ImageResult[]);
        if (results.length > 0) return results;
      }
      return [];
    }
    const provider = this.requireProvider(source);
    return provider.fetch(ctx);
  }

  private requireProvider(source: ResolvableImageSource): ImageProvider {
    const id = SOURCE_TO_PROVIDER_ID[source];
    const provider = this.providers.get(id);
    if (!provider) {
      throw new ServiceUnavailableException(`Image source "${source}" is not registered.`);
    }
    if (!provider.isAvailable()) {
      const unavailable = [...this.providers.values()]
        .filter((p) => !p.isAvailable())
        .map((p) => `${p.id} (missing: ${p.missingEnv.join(', ')})`);
      const available = [...this.providers.values()]
        .filter((p) => p.isAvailable())
        .map((p) => p.id);
      throw new ServiceUnavailableException({
        message: [
          `Image source "${source}" is not configured on this server.`,
          `Missing env: ${provider.missingEnv.join(', ')}.`,
          `Unavailable providers: ${unavailable.join('; ') || 'none'}.`,
          `Available providers: ${available.join(', ') || 'none'}.`,
        ],
      });
    }
    return provider;
  }
}
