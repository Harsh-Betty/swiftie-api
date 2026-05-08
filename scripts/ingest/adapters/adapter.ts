import type { Album, Song } from '../../../packages/data/src/schemas';
import type { IngestEnv } from '../env';
import type { Logger } from '../logger';

export interface AdapterContext {
  env: IngestEnv;
  logger: Logger;
}

export interface DataSourceAdapter {
  readonly id: string;
  readonly displayName: string;
  isAvailable(env: IngestEnv): boolean;
  enrichAlbum?(album: Album, ctx: AdapterContext): Promise<Partial<Album>>;
  enrichSong?(song: Song, album: Album, ctx: AdapterContext): Promise<Partial<Song>>;
}
