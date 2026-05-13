import type { Album, Song } from '../packages/data/src/schemas';
import { buildAdapterRegistry } from './ingest/adapters';
import { parseArgs } from './ingest/args';
import { bootstrapSongList, collectSongSeeds } from './ingest/bootstrap-songs';
import { Summary } from './ingest/diff';
import { parseEnv } from './ingest/env';
import {
  listAlbumSlugs,
  readAlbum,
  readOverride,
  readSongs,
  writeAlbum,
  writeSongs,
} from './ingest/io';
import { createLogger } from './ingest/logger';
import { applyAlbumOverride, applySongOverride, mergeAlbum, mergeSong } from './ingest/merge';

async function main(): Promise<void> {
  const args = parseArgs();
  const env = parseEnv();
  const logger = createLogger(args.verbose);

  let adapters = buildAdapterRegistry(env, logger);
  if (args.only) {
    adapters = adapters.filter((a) => a.id === args.only);
    if (adapters.length === 0) {
      logger.error(`No adapter matched --only=${args.only}`);
      process.exit(1);
    }
  }

  const slugs = args.albums ?? (await listAlbumSlugs());
  logger.info(
    {
      adapters: adapters.map((a) => a.id),
      albums: slugs,
      bootstrapSongs: args.bootstrapSongs,
      dryRun: args.dryRun,
    },
    'Ingest starting',
  );

  const summary = new Summary();

  for (const slug of slugs) {
    let baseline: Album;
    try {
      baseline = await readAlbum(slug);
    } catch (err) {
      summary.recordError(slug, 'io', err);
      logger.error({ err: (err as Error).message, slug }, 'failed to read album');
      continue;
    }

    let album = baseline;
    for (const adapter of adapters) {
      if (!adapter.enrichAlbum) continue;
      try {
        const partial = await adapter.enrichAlbum(album, { env, logger });
        album = mergeAlbum(album, partial, {
          source: adapter.id,
          summary,
          scope: { kind: 'album', albumSlug: slug },
        });
      } catch (err) {
        summary.recordError(slug, adapter.id, err);
        logger.warn({ err: (err as Error).message, slug, adapter: adapter.id }, 'adapter failed');
      }
    }

    let override: Awaited<ReturnType<typeof readOverride>> = null;
    try {
      override = await readOverride(slug);
    } catch (err) {
      summary.recordError(slug, 'override', err);
      logger.error({ err: (err as Error).message, slug }, 'failed to parse override');
    }
    if (override?.album) {
      album = applyAlbumOverride(album, override.album, {
        source: 'override',
        summary,
        scope: { kind: 'album', albumSlug: slug },
      });
    }

    let songs: Song[];
    try {
      songs = await readSongs(slug);
    } catch (err) {
      summary.recordError(slug, 'io', err);
      logger.error({ err: (err as Error).message, slug }, 'failed to read songs');
      if (!args.dryRun) {
        try {
          await writeAlbum(slug, album);
        } catch (error_) {
          summary.recordError(slug, 'io', error_);
        }
      }
      continue;
    }

    if (args.bootstrapSongs) {
      const seeds = await collectSongSeeds(album, adapters, { env, logger }, summary);
      songs = bootstrapSongList(album, songs, seeds, summary);
    }

    const updatedSongs: Song[] = [];
    for (const song of songs) {
      let next = song;
      for (const adapter of adapters) {
        if (!adapter.enrichSong) continue;
        try {
          const partial = await adapter.enrichSong(next, album, { env, logger });
          next = mergeSong(next, partial, {
            source: adapter.id,
            summary,
            scope: { kind: 'song', albumSlug: slug, songSlug: song.slug },
          });
        } catch (err) {
          summary.recordError(`${slug}/${song.slug}`, adapter.id, err);
          logger.warn(
            { err: (err as Error).message, slug, song: song.slug, adapter: adapter.id },
            'adapter failed',
          );
        }
      }
      const songOverride = override?.songs?.[song.slug];
      if (songOverride) {
        next = applySongOverride(next, songOverride, {
          source: 'override',
          summary,
          scope: { kind: 'song', albumSlug: slug, songSlug: song.slug },
        });
      }
      updatedSongs.push(next);
    }

    if (!args.dryRun) {
      try {
        await writeAlbum(slug, album);
        await writeSongs(slug, updatedSongs);
      } catch (err) {
        summary.recordError(slug, 'io', err);
        logger.error({ err: (err as Error).message, slug }, 'failed to write');
      }
    }
  }

  summary.print(logger, args.dryRun);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
