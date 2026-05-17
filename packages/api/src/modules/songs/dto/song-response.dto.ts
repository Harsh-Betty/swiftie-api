import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MusicVideoDto {
  @ApiProperty()
  title!: string;

  @ApiProperty({ type: [String] })
  director!: string[];

  @ApiProperty({ description: 'Release date in ISO-8601 (YYYY-MM-DD).' })
  releaseDate!: string;

  @ApiProperty()
  runtimeSeconds!: number;

  @ApiPropertyOptional()
  youtubeUrl?: string;

  @ApiPropertyOptional()
  vimeoUrl?: string;
}

export class LyricSectionDto {
  @ApiProperty({ example: 'Verse 1' })
  name!: string;

  @ApiProperty({ type: [String], description: 'Ordered lines of the section.' })
  lines!: string[];
}

export class LyricsDto {
  @ApiProperty({ type: [LyricSectionDto] })
  sections!: LyricSectionDto[];
}

export class SongResponseDto {
  @ApiProperty({ description: 'Kebab-case song slug.', example: 'cruel-summer' })
  slug!: string;

  @ApiProperty({ example: 'Cruel Summer' })
  title!: string;

  @ApiProperty({ description: 'Slug of the album the song belongs to.', example: 'lover' })
  albumSlug!: string;

  @ApiProperty({ example: 2 })
  trackNumber!: number;

  @ApiProperty({ example: 1 })
  discNumber!: number;

  @ApiProperty({ description: 'Duration in seconds.' })
  durationSeconds!: number;

  @ApiProperty({ type: [String] })
  writers!: string[];

  @ApiProperty({ type: [String] })
  producers!: string[];

  @ApiProperty({
    type: [String],
    description: 'Featured artists (other than Taylor Swift).',
  })
  features!: string[];

  @ApiProperty()
  isVaultTrack!: boolean;

  @ApiProperty()
  isBonusTrack!: boolean;

  @ApiProperty()
  isPromotionalRelease!: boolean;

  @ApiProperty({ description: 'Whether structured lyrics are available for this song.' })
  hasLyrics!: boolean;

  @ApiPropertyOptional({ description: 'Original release date if different from album.' })
  releaseDate?: string;

  @ApiPropertyOptional()
  musicbrainzRecordingId?: string;

  @ApiPropertyOptional()
  spotifyTrackId?: string;

  @ApiPropertyOptional()
  isrc?: string;

  @ApiPropertyOptional({ type: MusicVideoDto })
  musicVideo?: MusicVideoDto;

  @ApiProperty({ type: [String] })
  moods!: string[];

  @ApiProperty({ type: [String] })
  themes!: string[];

  @ApiPropertyOptional({
    type: LyricsDto,
    description: 'Structured lyrics. Omitted when ?withLyrics=false.',
  })
  lyrics?: LyricsDto;

  @ApiPropertyOptional({ description: 'Free-text credits string.' })
  credits?: string;
}
