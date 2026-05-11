import { Injectable, NotFoundException } from '@nestjs/common';
import { getSong, type ListSongsFilter, listSongs, type Song } from '@swiftie-api/data';
import { assertSlug } from '../../common/util/assert-slug';

export interface PagedSongs {
  items: Song[];
  total: number;
}

export type SongWithoutLyrics = Omit<Song, 'lyrics'>;

@Injectable()
export class SongsService {
  async list(filter: ListSongsFilter, limit: number, offset: number): Promise<PagedSongs> {
    const all = await listSongs(filter);
    return {
      items: all.slice(offset, offset + limit),
      total: all.length,
    };
  }

  async findOne(slug: string, withLyrics: boolean): Promise<Song | SongWithoutLyrics> {
    assertSlug(slug, 'Song slug');
    let song: Song;
    try {
      song = await getSong(slug);
    } catch {
      throw new NotFoundException(`Song with slug "${slug}" was not found.`);
    }
    if (withLyrics) return song;
    const { lyrics: _omit, ...rest } = song;
    return rest;
  }
}
