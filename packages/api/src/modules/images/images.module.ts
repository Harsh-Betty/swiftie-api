import { Module } from '@nestjs/common';
import { AlbumsModule } from '../albums/albums.module';
import { SongsModule } from '../songs/songs.module';
import { LruCacheService } from './cache/lru-cache.service';
import { ImagesController } from './images.controller';
import { ImagesService } from './images.service';
import { IMAGE_PROVIDER_CLASSES, imageProvidersFactory } from './providers/provider-registry';

@Module({
  imports: [AlbumsModule, SongsModule],
  controllers: [ImagesController],
  providers: [LruCacheService, ...IMAGE_PROVIDER_CLASSES, imageProvidersFactory, ImagesService],
})
export class ImagesModule {}
