import { ApiProperty } from '@nestjs/swagger';

export class SongRefDto {
  @ApiProperty({ example: 'cruel-summer' })
  slug!: string;

  @ApiProperty({ example: 'Cruel Summer' })
  title!: string;
}

export class AlbumRefDto {
  @ApiProperty({ example: 'lover' })
  slug!: string;

  @ApiProperty({ example: 'Lover' })
  title!: string;
}

export class LyricMatchDto {
  @ApiProperty({
    description: 'Lower-cased query token that matched.',
    example: 'summer',
  })
  term!: string;

  @ApiProperty({
    description:
      'Half-open character ranges [start, end) into `line` where the term occurs. Clients render their own highlights.',
    type: 'array',
    items: { type: 'array', items: { type: 'integer' }, minItems: 2, maxItems: 2 },
    example: [[6, 12]],
  })
  ranges!: number[][];
}

export class LyricsSearchResultDto {
  @ApiProperty({ type: SongRefDto })
  song!: SongRefDto;

  @ApiProperty({ type: AlbumRefDto })
  album!: AlbumRefDto;

  @ApiProperty({ description: 'The matched lyric line.' })
  line!: string;

  @ApiProperty({ description: 'Section name (e.g. "Chorus", "Verse 1").' })
  section!: string;

  @ApiProperty({ description: 'Zero-indexed line number within its section.' })
  lineNumber!: number;

  @ApiProperty({ description: 'Relevance score from the underlying search engine.' })
  score!: number;

  @ApiProperty({ type: [LyricMatchDto] })
  matches!: LyricMatchDto[];
}
