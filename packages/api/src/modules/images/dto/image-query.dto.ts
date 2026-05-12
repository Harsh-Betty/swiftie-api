import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export enum ImageSourceEnum {
  Cover = 'cover',
  Spotify = 'spotify',
  Pexels = 'pexels',
  Unsplash = 'unsplash',
  Reddit = 'reddit',
  Auto = 'auto',
}

export type ResolvableImageSource = Exclude<ImageSourceEnum, ImageSourceEnum.Auto>;

export const SOURCE_TO_PROVIDER_ID: Record<ResolvableImageSource, string> = {
  [ImageSourceEnum.Cover]: 'cover-art-archive',
  [ImageSourceEnum.Spotify]: 'spotify',
  [ImageSourceEnum.Pexels]: 'pexels',
  [ImageSourceEnum.Unsplash]: 'unsplash',
  [ImageSourceEnum.Reddit]: 'reddit',
};

export class ImageQueryDto {
  @ApiPropertyOptional({
    enum: ImageSourceEnum,
    description: 'Image source. Defaults to "cover" (always available).',
    default: ImageSourceEnum.Cover,
  })
  @IsOptional()
  @IsEnum(ImageSourceEnum)
  source?: ImageSourceEnum;

  @ApiPropertyOptional({
    description: 'Max number of images to return. Capped at 30.',
    minimum: 1,
    maximum: 30,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(30)
  limit?: number;
}

export class ImageSearchQueryDto extends ImageQueryDto {
  @ApiPropertyOptional({
    enum: ImageSourceEnum,
    description: 'Image source for /search. Must be a search-capable provider.',
    default: ImageSourceEnum.Pexels,
  })
  @IsOptional()
  @IsEnum(ImageSourceEnum)
  override source?: ImageSourceEnum;

  @ApiProperty({
    description: 'Free-form search query (min 2 chars). Required for /search.',
    example: 'taylor swift lover era',
    minLength: 2,
  })
  @IsString()
  @MinLength(2)
  q!: string;
}
