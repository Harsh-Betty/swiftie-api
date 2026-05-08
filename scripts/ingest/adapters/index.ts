import type { IngestEnv } from '../env';
import type { Logger } from '../logger';
import type { DataSourceAdapter } from './adapter';
import { coverArtArchiveAdapter } from './cover-art-archive';
import { musicbrainzAdapter } from './musicbrainz';
import { spotifyAdapter } from './spotify';

const REGISTRY: readonly DataSourceAdapter[] = [
  musicbrainzAdapter,
  coverArtArchiveAdapter,
  spotifyAdapter,
];

export function buildAdapterRegistry(env: IngestEnv, logger: Logger): readonly DataSourceAdapter[] {
  const enabled: DataSourceAdapter[] = [];
  for (const adapter of REGISTRY) {
    if (adapter.isAvailable(env)) {
      enabled.push(adapter);
    } else {
      logger.info(`[${adapter.id}] disabled (env vars missing)`);
    }
  }
  return enabled;
}
