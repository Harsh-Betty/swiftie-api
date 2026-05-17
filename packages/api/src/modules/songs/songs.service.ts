import { Injectable, NotFoundException } from '@nestjs/common';
import { getSong, type ListSongsFilter, listSongs, type Song } from '@swiftie-api/data';
import { assertSlug } from '../../common/util/assert-slug';

export interface PagedSongs {
  items: SongResponse[];
  total: number;
}

export type SongResponse = Song & { hasLyrics: boolean };
export type SongWithoutLyrics = Omit<SongResponse, 'lyrics'>;

export function toSongResponse(song: Song): SongResponse {
  return {
    ...song,
    hasLyrics: song.lyrics.sections.length > 0,
  };
}

@Injectable()
export class SongsService {
  async list(filter: ListSongsFilter, limit: number, offset: number): Promise<PagedSongs> {
    const all = await listSongs(filter);
    return {
      items: all.slice(offset, offset + limit).map(toSongResponse),
      total: all.length,
    };
  }

  async findOne(slug: string, withLyrics: boolean): Promise<SongResponse | SongWithoutLyrics> {
    assertSlug(slug, 'Song slug');
    let song: Song;
    try {
      song = await getSong(slug);
    } catch {
      throw new NotFoundException(`Song with slug "${slug}" was not found.`);
    }
    const response = toSongResponse(song);
    if (withLyrics) return response;
    const { lyrics: _omit, ...rest } = response;
    return rest;
  }
}
