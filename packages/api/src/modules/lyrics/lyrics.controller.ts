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
import { LyricsResponseDto } from './dto/lyrics-response.dto';
import type { LyricsSearchQueryDto } from './dto/lyrics-search-query.dto';
import { LyricsSearchResultDto } from './dto/lyrics-search-result.dto';
import type { LyricsService } from './lyrics.service';

@ApiTags('lyrics')
@ApiTooManyRequestsResponse({ description: 'Throttle quota exceeded.' })
@ApiInternalServerErrorResponse({ description: 'Unexpected server error.' })
@Controller({ path: 'lyrics', version: '1' })
export class LyricsController {
  constructor(private readonly lyrics: LyricsService) {}

  @Get('search')
  @ApiOperation({
    summary: 'Full-text search across all lyrics.',
    description:
      'Searches every indexed lyric line using a MiniSearch index with prefix matching and light fuzziness. Returns hits sorted by relevance score. Match positions are returned as half-open character ranges `[start, end)`; clients render their own highlights.',
  })
  @ApiOkResponse({ type: [LyricsSearchResultDto] })
  @ApiBadRequestResponse({ description: 'Missing or invalid `q` parameter.' })
  search(@Query() query: LyricsSearchQueryDto): Promise<LyricsSearchResultDto[]> {
    return this.lyrics.search(query.q, query.limit ?? 20);
  }

  @Get(':songSlug')
  @ApiOperation({
    summary: 'Get the full structured lyrics for a single song.',
    description: 'Returns lyrics grouped by section (verse, chorus, bridge, etc.).',
  })
  @ApiParam({
    name: 'songSlug',
    description: 'Kebab-case song slug.',
    example: 'cruel-summer',
  })
  @ApiOkResponse({ type: LyricsResponseDto })
  @ApiBadRequestResponse({ description: 'Slug is not in kebab-case.' })
  @ApiNotFoundResponse({ description: 'No song exists for the given slug.' })
  findBySong(@Param('songSlug') songSlug: string): Promise<LyricsResponseDto> {
    return this.lyrics.findBySong(songSlug);
  }
}
