import { Injectable, NotFoundException } from '@nestjs/common';
import { getAlbum, getSong, searchLyrics } from '@swiftie-api/data';
import { assertSlug } from '../../common/util/assert-slug';
import type { LyricsResponseDto } from './dto/lyrics-response.dto';
import type { LyricsSearchResultDto } from './dto/lyrics-search-result.dto';

@Injectable()
export class LyricsService {
  async search(q: string, limit: number): Promise<LyricsSearchResultDto[]> {
    const hits = await searchLyrics(q, { limit });
    if (hits.length === 0) return [];

    // Enrich each hit with the album title. The album loader caches in-memory,
    // so repeated lookups across hits stay O(1) per unique album.
    const uniqueAlbumSlugs = Array.from(new Set(hits.map((h) => h.albumSlug)));
    const albumEntries = await Promise.all(
      uniqueAlbumSlugs.map(async (slug) => [slug, (await getAlbum(slug)).title] as const),
    );
    const albumTitleBySlug = new Map(albumEntries);

    return hits.map((h) => ({
      song: { slug: h.songSlug, title: h.songTitle },
      album: { slug: h.albumSlug, title: albumTitleBySlug.get(h.albumSlug) ?? h.albumSlug },
      line: h.text,
      section: h.section,
      lineNumber: h.lineNumber,
      score: h.score,
      matches: h.matches.map((m) => ({
        term: m.term,
        ranges: m.ranges.map(([start, end]) => [start, end]),
      })),
    }));
  }

  async findBySong(songSlug: string): Promise<LyricsResponseDto> {
    assertSlug(songSlug, 'Song slug');
    try {
      const song = await getSong(songSlug);
      return {
        songSlug: song.slug,
        songTitle: song.title,
        albumSlug: song.albumSlug,
        sections: song.lyrics.sections,
      };
    } catch {
      throw new NotFoundException(`Song with slug "${songSlug}" was not found.`);
    }
  }
}
