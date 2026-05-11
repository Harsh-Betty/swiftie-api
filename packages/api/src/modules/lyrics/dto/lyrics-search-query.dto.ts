import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class LyricsSearchQueryDto {
  @ApiProperty({
    description: 'Full-text search query. Tokens are matched with prefix + light fuzziness.',
    example: 'cruel summer',
  })
  @IsString()
  @IsNotEmpty({ message: 'q is required.' })
  q!: string;

  @ApiPropertyOptional({
    description: 'Maximum number of hits to return. Capped at 100.',
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
