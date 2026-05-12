import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiServiceUnavailableResponse,
  ApiTags,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { assertSlug } from '../../common/util/assert-slug';
import { ImageQueryDto, ImageSearchQueryDto, ImageSourceEnum } from './dto/image-query.dto';
import { ImageResultDto } from './dto/image-response.dto';
import { ImagesService } from './images.service';
import { AUTO_SOURCE_PRIORITY } from './providers/provider-registry';

const AUTO_WALK_ORDER = AUTO_SOURCE_PRIORITY.join(' -> ');

@ApiTags('images')
@ApiTooManyRequestsResponse({ description: 'Throttle quota exceeded.' })
@ApiInternalServerErrorResponse({ description: 'Unexpected server error.' })
@Controller({ path: 'images', version: '1' })
export class ImagesController {
  constructor(private readonly images: ImagesService) {}

  @Get('album/:slug')
  @ApiOperation({
    summary: 'Get images for an album.',
    description: `Returns images for an album. \`source=cover\` (default) reads Cover Art Archive via the album MBID. \`source=auto\` walks ${AUTO_WALK_ORDER} and returns the first non-empty result.`,
  })
  @ApiParam({ name: 'slug', description: 'Kebab-case album slug.', example: 'lover' })
  @ApiOkResponse({ type: [ImageResultDto] })
  @ApiBadRequestResponse({ description: 'Slug not kebab-case or invalid query.' })
  @ApiNotFoundResponse({ description: 'Album slug not found.' })
  @ApiServiceUnavailableResponse({
    description: 'Requested source is not configured on this server.',
  })
  forAlbum(@Param('slug') slug: string, @Query() query: ImageQueryDto) {
    assertSlug(slug, 'Album slug');
    const source = query.source ?? ImageSourceEnum.Cover;
    const limit = query.limit ?? 10;
    return this.images.forAlbum(slug, source, limit);
  }

  @Get('song/:slug')
  @ApiOperation({
    summary: 'Get images for a song.',
    description:
      '`cover` and `spotify` sources fall back to the parent album cover. Search-capable sources (pexels, unsplash, reddit) use the song title + " taylor swift" as the query.',
  })
  @ApiParam({ name: 'slug', description: 'Kebab-case song slug.', example: 'cruel-summer' })
  @ApiOkResponse({ type: [ImageResultDto] })
  @ApiBadRequestResponse({ description: 'Slug not kebab-case or invalid query.' })
  @ApiNotFoundResponse({ description: 'Song slug not found.' })
  @ApiServiceUnavailableResponse({
    description: 'Requested source is not configured on this server.',
  })
  forSong(@Param('slug') slug: string, @Query() query: ImageQueryDto) {
    assertSlug(slug, 'Song slug');
    const source = query.source ?? ImageSourceEnum.Cover;
    const limit = query.limit ?? 10;
    return this.images.forSong(slug, source, limit);
  }

  @Get('search')
  @ApiOperation({
    summary: 'Free-form image search.',
    description:
      'Only routes to search-capable providers (pexels, unsplash, reddit). Returns 400 if source is cover or spotify.',
  })
  @ApiOkResponse({ type: [ImageResultDto] })
  @ApiBadRequestResponse({
    description: 'Missing `q`, or source does not support free-form search.',
  })
  @ApiServiceUnavailableResponse({
    description: 'Requested source is not configured on this server.',
  })
  search(@Query() query: ImageSearchQueryDto) {
    const source = query.source ?? ImageSourceEnum.Pexels;
    const limit = query.limit ?? 10;
    return this.images.search(query.q, source, limit);
  }
}
