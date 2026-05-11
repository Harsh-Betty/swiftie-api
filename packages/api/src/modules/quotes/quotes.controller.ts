import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import type { DailyQuoteQueryDto } from './dto/daily-quote-query.dto';
import type { ListQuotesQueryDto } from './dto/list-quotes-query.dto';
import { QuoteResponseDto } from './dto/quote-response.dto';
import type { QuotesService } from './quotes.service';

@ApiTags('quotes')
@ApiTooManyRequestsResponse({ description: 'Throttle quota exceeded.' })
@ApiInternalServerErrorResponse({ description: 'Unexpected server error.' })
@Controller({ path: 'quotes', version: '1' })
export class QuotesController {
  constructor(private readonly quotes: QuotesService) {}

  @Get('random')
  @ApiOperation({
    summary: 'Get a random quote from the entire pool.',
    description: 'Non-deterministic - calling twice in a row will likely yield different quotes.',
  })
  @ApiOkResponse({ type: QuoteResponseDto })
  random(): Promise<QuoteResponseDto> {
    return this.quotes.random() as Promise<QuoteResponseDto>;
  }

  @Get('daily')
  @ApiOperation({
    summary: 'Get the deterministic quote of the day.',
    description:
      "Deterministic by UTC date - the same YYYY-MM-DD always yields the same quote. The date string is hashed with FNV-1a and modulo'd into the array of featured quotes (falling back to all quotes if no featured pool exists). Calling this endpoint twice on the same UTC day returns the same quote.",
  })
  @ApiOkResponse({ type: QuoteResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid `date` parameter (must be YYYY-MM-DD).' })
  daily(@Query() query: DailyQuoteQueryDto): Promise<QuoteResponseDto> {
    return this.quotes.daily(query.date) as Promise<QuoteResponseDto>;
  }

  @Get()
  @ApiOperation({
    summary: 'List quotes with optional filters.',
    description:
      'Returns up to `limit` quotes matching the given filters. No offset pagination - quotes is a small dataset.',
  })
  @ApiOkResponse({ type: [QuoteResponseDto] })
  @ApiBadRequestResponse({ description: 'Invalid query parameters.' })
  async list(@Query() query: ListQuotesQueryDto): Promise<QuoteResponseDto[]> {
    return (await this.quotes.list(
      {
        albumSlug: query.album,
        songSlug: query.song,
        mood: query.mood,
        featured: query.featured,
      },
      query.limit ?? 20,
    )) as QuoteResponseDto[];
  }
}
