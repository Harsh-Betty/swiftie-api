import { Controller, Get, Param } from '@nestjs/common';
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
import { EraDetailResponseDto } from './dto/era-detail-response.dto';
import { EraResponseDto } from './dto/era-response.dto';
import type { ErasService } from './eras.service';

@ApiTags('eras')
@ApiTooManyRequestsResponse({ description: 'Throttle quota exceeded.' })
@ApiInternalServerErrorResponse({ description: 'Unexpected server error.' })
@Controller({ path: 'eras', version: '1' })
export class ErasController {
  constructor(private readonly eras: ErasService) {}

  @Get()
  @ApiOperation({
    summary: 'List all eras.',
    description: 'Returns every era in release order, with album slugs but not full album objects.',
  })
  @ApiOkResponse({ type: [EraResponseDto] })
  list(): Promise<EraResponseDto[]> {
    return this.eras.list() as Promise<EraResponseDto[]>;
  }

  @Get(':slug')
  @ApiOperation({
    summary: 'Get a single era with full album objects.',
    description:
      "Returns the era's metadata along with hydrated AlbumResponseDto entries for every album slug in the era.",
  })
  @ApiParam({ name: 'slug', description: 'Kebab-case era slug.', example: 'lover' })
  @ApiOkResponse({ type: EraDetailResponseDto })
  @ApiBadRequestResponse({ description: 'Slug is not in kebab-case.' })
  @ApiNotFoundResponse({ description: 'No era exists for the given slug.' })
  findOne(@Param('slug') slug: string): Promise<EraDetailResponseDto> {
    return this.eras.findOne(slug);
  }
}
