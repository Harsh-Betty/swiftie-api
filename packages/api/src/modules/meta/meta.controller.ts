import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import {
  getAllAlbums,
  getAllQuotes,
  getCanonicalAlbums,
  getEras,
  getSongsByAlbum,
} from '@swiftie-api/data';
import { SERVER_VERSION } from '../../app.constants';

class MetaCountsDto {
  @ApiProperty({ description: "Count of canonical (non-Taylor's Version) entries." })
  canonical!: number;

  @ApiProperty({ description: "Count of Taylor's Version (re-recorded) entries." })
  taylorsVersions!: number;

  @ApiProperty({ description: 'Total count, equals canonical + taylorsVersions.' })
  all!: number;
}

class MetaResponseDto {
  @ApiProperty({ description: 'Server package version.' })
  version!: string;

  @ApiProperty({ type: MetaCountsDto })
  albums!: MetaCountsDto;

  @ApiProperty({
    type: MetaCountsDto,
    description:
      'Song counts. `all` is canonical + taylorsVersions and double-counts re-recorded songs by design.',
  })
  songs!: MetaCountsDto;

  @ApiProperty()
  totalQuotes!: number;

  @ApiProperty({ type: [String], description: 'Slug of every era available in the dataset.' })
  eras!: string[];

  @ApiProperty({ description: 'ISO timestamp of when the underlying data was last ingested.' })
  dataLastIngested!: string;
}

@ApiTags('meta')
@Controller({ path: 'meta', version: '1' })
export class MetaController {
  private readonly dataLoadedAt = new Date();

  @Get()
  @ApiOperation({
    summary: 'API metadata and dataset counts.',
    description:
      'Returns aggregate counts across the dataset along with the server version. Useful for client-side cache invalidation and feature discovery.',
  })
  @ApiOkResponse({ type: MetaResponseDto })
  async meta(): Promise<MetaResponseDto> {
    const [allAlbums, canonicalAlbums, eras, quotes] = await Promise.all([
      getAllAlbums(),
      getCanonicalAlbums(),
      getEras(),
      getAllQuotes(),
    ]);

    const canonicalSlugs = new Set(canonicalAlbums.map((a) => a.slug));
    const songCountsBySlug = await Promise.all(
      allAlbums.map(async (a) => ({
        slug: a.slug,
        count: (await getSongsByAlbum(a.slug)).length,
      })),
    );

    const canonicalSongCount = songCountsBySlug
      .filter((s) => canonicalSlugs.has(s.slug))
      .reduce((sum, s) => sum + s.count, 0);
    const taylorsVersionSongCount = songCountsBySlug
      .filter((s) => !canonicalSlugs.has(s.slug))
      .reduce((sum, s) => sum + s.count, 0);

    return {
      version: SERVER_VERSION,
      albums: {
        canonical: canonicalAlbums.length,
        taylorsVersions: allAlbums.length - canonicalAlbums.length,
        all: allAlbums.length,
      },
      songs: {
        canonical: canonicalSongCount,
        taylorsVersions: taylorsVersionSongCount,
        all: canonicalSongCount + taylorsVersionSongCount,
      },
      totalQuotes: quotes.length,
      eras: eras.map((e) => e.slug),
      dataLastIngested: this.dataLoadedAt.toISOString(),
    };
  }
}
