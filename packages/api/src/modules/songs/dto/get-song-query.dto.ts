import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class GetSongQueryDto {
  @ApiPropertyOptional({
    description: 'Include structured lyrics in the response. Defaults to true.',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value !== 'false')
  withLyrics?: boolean = true;
}
