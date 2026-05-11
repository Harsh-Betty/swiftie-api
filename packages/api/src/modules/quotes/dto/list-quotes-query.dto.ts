import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const toBool = ({ value }: { value: unknown }): unknown =>
  value === 'true' ? true : value === 'false' ? false : value;

export class ListQuotesQueryDto {
  @ApiPropertyOptional({ description: 'Filter by album slug.', example: 'lover' })
  @IsOptional()
  @IsString()
  @Matches(SLUG_RE, { message: 'album must be kebab-case.' })
  album?: string;

  @ApiPropertyOptional({ description: 'Filter by song slug.', example: 'cruel-summer' })
  @IsOptional()
  @IsString()
  @Matches(SLUG_RE, { message: 'song must be kebab-case.' })
  song?: string;

  @ApiPropertyOptional({ description: 'Filter by mood tag (case-insensitive exact match).' })
  @IsOptional()
  @IsString()
  mood?: string;

  @ApiPropertyOptional({ description: 'Restrict to featured quotes only.' })
  @IsOptional()
  @IsBoolean()
  @Transform(toBool)
  featured?: boolean;

  @ApiPropertyOptional({
    description: 'Maximum number of quotes to return. Capped at 100.',
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
