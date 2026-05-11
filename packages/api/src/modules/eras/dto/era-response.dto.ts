import { ApiProperty } from '@nestjs/swagger';

export class EraResponseDto {
  @ApiProperty({ description: 'Kebab-case era slug.', example: 'lover' })
  slug!: string;

  @ApiProperty({ example: 'Lover' })
  name!: string;

  @ApiProperty({ example: 'Lover' })
  displayName!: string;

  @ApiProperty({ description: 'Hex color associated with the era.', example: '#ffb6c1' })
  color!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty({ description: 'Era start date in ISO-8601 (YYYY-MM-DD).' })
  startDate!: string;

  @ApiProperty({
    description: 'Era end date in ISO-8601 (YYYY-MM-DD). Null while the era is ongoing.',
    nullable: true,
    type: String,
  })
  endDate!: string | null;

  @ApiProperty({ type: [String], description: 'Albums belonging to this era, by slug.' })
  albumSlugs!: string[];

  @ApiProperty({
    type: [String],
    description: 'Free-form keywords describing the era aesthetic.',
  })
  iconographyKeywords!: string[];
}
