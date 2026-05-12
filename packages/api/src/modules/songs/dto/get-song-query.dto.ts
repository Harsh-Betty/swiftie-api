import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

const toBool = ({ value }: { value: unknown }): unknown =>
  value === 'true' ? true : value === 'false' ? false : value;

export class GetSongQueryDto {
  @ApiPropertyOptional({
    description: 'Include structured lyrics in the response. Defaults to true.',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(toBool)
  withLyrics?: boolean = true;
}
