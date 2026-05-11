import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString, Matches } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export enum AlbumTypeEnum {
  Studio = 'studio',
  TaylorsVersion = 'taylors_version',
  Ep = 'ep',
  Compilation = 'compilation',
}

export enum TaylorsVersionStatusEnum {
  Released = 'released',
  Unreleased = 'unreleased',
  NotApplicable = 'not_applicable',
}

export class ListAlbumsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by era slug.', example: 'lover' })
  @IsOptional()
  @IsString()
  @Matches(SLUG_RE, { message: 'era must be kebab-case.' })
  era?: string;

  @ApiPropertyOptional({ enum: AlbumTypeEnum, description: 'Filter by album type.' })
  @IsOptional()
  @IsEnum(AlbumTypeEnum)
  type?: AlbumTypeEnum;

  @ApiPropertyOptional({
    enum: TaylorsVersionStatusEnum,
    description: "Filter by Taylor's Version status.",
  })
  @IsOptional()
  @IsEnum(TaylorsVersionStatusEnum)
  taylorsVersion?: TaylorsVersionStatusEnum;

  @ApiPropertyOptional({
    description:
      "Include Taylor's Versions in the result. Defaults to false; the canonical list mirrors meta.albums.canonical.",
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  includeTaylorsVersions?: boolean = false;
}
