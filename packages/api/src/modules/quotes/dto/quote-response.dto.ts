import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QuoteResponseDto {
  @ApiProperty({ description: 'Stable quote identifier.', example: 'cruel-summer-1' })
  id!: string;

  @ApiProperty({
    description: 'The quoted lyric text.',
    example: "It's cool, that's what I tell 'em. No rules in breakable heaven.",
  })
  text!: string;

  @ApiProperty({ description: 'Slug of the song this quote is from.', example: 'cruel-summer' })
  songSlug!: string;

  @ApiProperty({ description: 'Slug of the album this quote is from.', example: 'lover' })
  albumSlug!: string;

  @ApiPropertyOptional({ description: 'Section name within the song.' })
  section?: string;

  @ApiPropertyOptional({
    type: [Number],
    description: 'Zero-indexed line numbers within the section.',
  })
  lineNumbers?: number[];

  @ApiPropertyOptional({ description: 'Loose tagging of emotional register.' })
  mood?: string;

  @ApiProperty({ description: 'Whether this quote is part of the curated featured pool.' })
  featured!: boolean;
}
