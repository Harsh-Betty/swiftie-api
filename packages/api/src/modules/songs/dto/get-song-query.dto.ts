import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

const toBool = ({ value }: { value: unknown }): unknown =>
  value === 'true' ? true : value === 'false' ? false : value;

export class GetSongQueryDto {
  @ApiPropertyOptional({
    description: 'Include the lyrics payload in the response when available. Defaults to true.',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(toBool)
  withLyrics?: boolean = true;
}
