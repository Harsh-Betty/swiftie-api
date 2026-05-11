import { ApiProperty } from '@nestjs/swagger';
import { LyricSectionDto } from '../../songs/dto/song-response.dto';

export class LyricsResponseDto {
  @ApiProperty({ example: 'cruel-summer' })
  songSlug!: string;

  @ApiProperty({ example: 'Cruel Summer' })
  songTitle!: string;

  @ApiProperty({ example: 'lover' })
  albumSlug!: string;

  @ApiProperty({ type: [LyricSectionDto] })
  sections!: LyricSectionDto[];
}
