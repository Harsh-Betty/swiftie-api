import { Injectable, NotFoundException } from '@nestjs/common';
import {
  type Album,
  getAlbum,
  getSongsByAlbum,
  type ListAlbumsFilter,
  listAlbums,
  type Song,
} from '@swiftie-api/data';
import { assertSlug } from '../../common/util/assert-slug';

export interface PagedAlbums {
  items: Album[];
  total: number;
}

@Injectable()
export class AlbumsService {
  async list(filter: ListAlbumsFilter, limit: number, offset: number): Promise<PagedAlbums> {
    const all = await listAlbums(filter);
    return {
      items: all.slice(offset, offset + limit),
      total: all.length,
    };
  }

  async findOne(slug: string): Promise<Album> {
    assertSlug(slug, 'Album slug');
    try {
      return await getAlbum(slug);
    } catch {
      throw new NotFoundException(`Album with slug "${slug}" was not found.`);
    }
  }

  async findSongs(slug: string): Promise<Song[]> {
    assertSlug(slug, 'Album slug');
    // Confirm the album exists so we 404 on unknown album rather than empty array.
    await this.findOne(slug);
    const songs = await getSongsByAlbum(slug);
    return [...songs].sort((a, b) => a.discNumber - b.discNumber || a.trackNumber - b.trackNumber);
  }
}
