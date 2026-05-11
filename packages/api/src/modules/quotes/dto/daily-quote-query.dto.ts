import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, Matches } from 'class-validator';

export class DailyQuoteQueryDto {
  @ApiPropertyOptional({
    description:
      'UTC date key in YYYY-MM-DD form. Defaults to today (UTC). Same date always yields the same quote.',
    example: '2026-05-10',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be in YYYY-MM-DD format.' })
  date?: string;
}
