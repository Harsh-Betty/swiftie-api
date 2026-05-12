import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, Matches } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const toBool = ({ value }: { value: unknown }): unknown =>
  value === 'true' ? true : value === 'false' ? false : value;

export class ListSongsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by album slug.', example: 'lover' })
  @IsOptional()
  @IsString()
  @Matches(SLUG_RE, { message: 'album must be kebab-case.' })
  album?: string;

  @ApiPropertyOptional({ description: 'Only return vault tracks (true) or non-vault (false).' })
  @IsOptional()
  @IsBoolean()
  @Transform(toBool)
  vault?: boolean;

  @ApiPropertyOptional({ description: 'Only return bonus tracks (true) or non-bonus (false).' })
  @IsOptional()
  @IsBoolean()
  @Transform(toBool)
  bonus?: boolean;

  @ApiPropertyOptional({
    description: 'Case-insensitive substring filter against the song features list.',
    example: 'Bon Iver',
  })
  @IsOptional()
  @IsString()
  feature?: string;

  @ApiPropertyOptional({
    description:
      "Include songs from Taylor's Versions. Defaults to false; canonical default matches meta.songs.canonical.",
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(toBool)
  includeTaylorsVersions?: boolean = false;
}
