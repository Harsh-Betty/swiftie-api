import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { AppConfigModule } from './config/config.module';
import { AppConfigService } from './config/config.service';
import { pinoFactory } from './config/pino.factory';
import { AlbumsModule } from './modules/albums/albums.module';
import { ErasModule } from './modules/eras/eras.module';
import { HealthModule } from './modules/health/health.module';
import { LyricsModule } from './modules/lyrics/lyrics.module';
import { MetaModule } from './modules/meta/meta.module';
import { QuotesModule } from './modules/quotes/quotes.module';
import { SongsModule } from './modules/songs/songs.module';

@Module({
  imports: [
    AppConfigModule,
    LoggerModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: pinoFactory,
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        { name: 'short', ttl: 1_000, limit: 10 },
        { name: 'medium', ttl: 60_000, limit: 60 },
        { name: 'long', ttl: 3_600_000, limit: 1000 },
      ],
    }),
    HealthModule,
    MetaModule,
    AlbumsModule,
    SongsModule,
    LyricsModule,
    QuotesModule,
    ErasModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
