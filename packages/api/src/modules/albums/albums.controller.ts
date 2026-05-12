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
import { SongResponseDto } from '../songs/dto/song-response.dto';
import { AlbumsService } from './albums.service';
import { AlbumResponseDto } from './dto/album-response.dto';
import { ListAlbumsQueryDto } from './dto/list-albums-query.dto';

@ApiTags('albums')
@ApiTooManyRequestsResponse({ description: 'Throttle quota exceeded.' })
@ApiInternalServerErrorResponse({ description: 'Unexpected server error.' })
@Controller({ path: 'albums', version: '1' })
export class AlbumsController {
  constructor(private readonly albums: AlbumsService) {}

  @Get()
  @ApiOperation({
    summary: 'List albums.',
    description:
      "Returns albums with optional filters. By default returns canonical albums only (count matches meta.albums.canonical). Pass ?includeTaylorsVersions=true to include Taylor's Versions in the list.",
  })
  @ApiPaginatedResponse(AlbumResponseDto)
  @ApiBadRequestResponse({ description: 'Invalid query parameters.' })
  async list(@Query() query: ListAlbumsQueryDto) {
    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;
    const { items, total } = await this.albums.list(
      {
        era: query.era,
        type: query.type,
        taylorsVersion: query.taylorsVersion,
        includeTaylorsVersions: query.includeTaylorsVersions,
      },
      limit,
      offset,
    );
    return { data: items, meta: { total, limit, offset } };
  }

  @Get(':slug')
  @ApiOperation({
    summary: 'Get a single album by slug.',
    description: 'Returns full album metadata including cover art, producers, writers, and trivia.',
  })
  @ApiParam({ name: 'slug', description: 'Kebab-case album slug.', example: 'lover' })
  @ApiOkResponse({ type: AlbumResponseDto })
  @ApiBadRequestResponse({ description: 'Slug is not in kebab-case.' })
  @ApiNotFoundResponse({ description: 'No album exists for the given slug.' })
  findOne(@Param('slug') slug: string): Promise<AlbumResponseDto> {
    return this.albums.findOne(slug) as Promise<AlbumResponseDto>;
  }

  @Get(':slug/songs')
  @ApiOperation({
    summary: 'List songs in an album.',
    description: 'Returns the album track-listing ordered by disc and track number.',
  })
  @ApiParam({ name: 'slug', description: 'Kebab-case album slug.', example: 'lover' })
  @ApiOkResponse({ type: [SongResponseDto] })
  @ApiBadRequestResponse({ description: 'Slug is not in kebab-case.' })
  @ApiNotFoundResponse({ description: 'No album exists for the given slug.' })
  findSongs(@Param('slug') slug: string): Promise<SongResponseDto[]> {
    return this.albums.findSongs(slug) as Promise<SongResponseDto[]>;
  }
}
