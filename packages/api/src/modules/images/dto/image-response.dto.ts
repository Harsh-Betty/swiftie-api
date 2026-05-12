import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ImageAttributionDto {
  @ApiPropertyOptional({ description: 'Author or photographer name.' })
  author?: string;

  @ApiPropertyOptional({ description: 'URL to the author profile.' })
  authorUrl?: string;

  @ApiPropertyOptional({ description: 'Human-readable license summary.' })
  license?: string;

  @ApiPropertyOptional({ description: 'Canonical license URL.' })
  licenseUrl?: string;
}

export class ImageResultDto {
  @ApiProperty({ description: 'Direct URL to the image (no proxy).' })
  url!: string;

  @ApiPropertyOptional({ description: 'Direct URL to a thumbnail-sized variant.' })
  thumbnailUrl?: string;

  @ApiPropertyOptional({ description: 'Width in pixels, when known.' })
  width?: number;

  @ApiPropertyOptional({ description: 'Height in pixels, when known.' })
  height?: number;

  @ApiProperty({
    description: 'Provider id.',
    example: 'cover-art-archive',
  })
  source!: string;

  @ApiPropertyOptional({
    description: 'URL to the upstream page (attribution target).',
  })
  sourceUrl?: string;

  @ApiProperty({ type: ImageAttributionDto })
  attribution!: ImageAttributionDto;

  @ApiPropertyOptional({
    description: 'Provider-specific metadata (brand requirements, ids, blur hash, etc).',
    type: Object,
  })
  meta?: Record<string, unknown>;
}
