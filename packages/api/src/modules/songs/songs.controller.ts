import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { ApiPaginatedResponse } from '../../common/decorators/api-paginated-response.decorator';
import type { GetSongQueryDto } from './dto/get-song-query.dto';
import type { ListSongsQueryDto } from './dto/list-songs-query.dto';
import { SongResponseDto } from './dto/song-response.dto';
import type { SongsService } from './songs.service';

@ApiTags('songs')
@ApiTooManyRequestsResponse({ description: 'Throttle quota exceeded.' })
@ApiInternalServerErrorResponse({ description: 'Unexpected server error.' })
@Controller({ path: 'songs', version: '1' })
export class SongsController {
  constructor(private readonly songs: SongsService) {}

  @Get()
  @ApiOperation({
    summary: 'List songs across the catalog.',
    description:
      "Returns songs with optional filters. By default excludes songs from Taylor's Versions (canonical-only, matches meta.songs.canonical). Pass ?includeTaylorsVersions=true to include them.",
  })
  @ApiPaginatedResponse(SongResponseDto)
  @ApiBadRequestResponse({ description: 'Invalid query parameters.' })
  async list(@Query() query: ListSongsQueryDto) {
    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;
    const { items, total } = await this.songs.list(
      {
        albumSlug: query.album,
        isVaultTrack: query.vault,
        isBonusTrack: query.bonus,
        feature: query.feature,
        includeTaylorsVersions: query.includeTaylorsVersions,
      },
      limit,
      offset,
    );
    return { data: items, meta: { total, limit, offset } };
  }

  @Get(':slug')
  @ApiOperation({
    summary: 'Get a single song by slug.',
    description:
      'Returns full song metadata, including structured lyrics by default. Pass ?withLyrics=false to omit the lyrics payload.',
  })
  @ApiParam({ name: 'slug', description: 'Kebab-case song slug.', example: 'cruel-summer' })
  @ApiOkResponse({ type: SongResponseDto })
  @ApiBadRequestResponse({ description: 'Slug is not in kebab-case.' })
  @ApiNotFoundResponse({ description: 'No song exists for the given slug.' })
  findOne(@Param('slug') slug: string, @Query() query: GetSongQueryDto): Promise<SongResponseDto> {
    return this.songs.findOne(slug, query.withLyrics ?? true) as Promise<SongResponseDto>;
  }
}
