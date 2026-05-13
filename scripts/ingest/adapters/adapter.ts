import type { Album, Song } from '../../../packages/data/src/schemas';
import type { IngestEnv } from '../env';
import type { Logger } from '../logger';
import type { SongSeed } from '../song-seed';

export interface AdapterContext {
  env: IngestEnv;
  logger: Logger;
}

export interface DataSourceAdapter {
  readonly id: string;
  readonly displayName: string;
  isAvailable(env: IngestEnv): boolean;
  listAlbumTracks?(album: Album, ctx: AdapterContext): Promise<SongSeed[]>;
  enrichAlbum?(album: Album, ctx: AdapterContext): Promise<Partial<Album>>;
  enrichSong?(song: Song, album: Album, ctx: AdapterContext): Promise<Partial<Song>>;
}
