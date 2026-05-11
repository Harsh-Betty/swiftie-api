import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CoverArtSourcesDto {
  @ApiPropertyOptional({ description: 'Cover Art Archive URL.' })
  coverArtArchive?: string;

  @ApiPropertyOptional({ description: 'Spotify cover art URL.' })
  spotify?: string;

  @ApiPropertyOptional({ description: 'Manually-curated cover art URL.' })
  manual?: string;
}

export class CoverArtDto {
  @ApiProperty({ description: 'Primary cover art URL. May be empty if unknown.' })
  primary!: string;

  @ApiProperty({ type: CoverArtSourcesDto })
  sources!: CoverArtSourcesDto;
}

export class TaylorsVersionDto {
  @ApiProperty({ enum: ['released', 'unreleased', 'not_applicable'] })
  status!: 'released' | 'unreleased' | 'not_applicable';

  @ApiPropertyOptional({ description: 'Slug of the original album this re-records.' })
  originalAlbumSlug?: string;

  @ApiPropertyOptional({ description: "Slug of the Taylor's Version re-record." })
  taylorsVersionAlbumSlug?: string;
}

export class AlbumResponseDto {
  @ApiProperty({ description: 'Kebab-case album slug.', example: 'lover' })
  slug!: string;

  @ApiProperty({ example: 'Lover' })
  title!: string;

  @ApiPropertyOptional({ description: 'Optional subtitle / edition.' })
  subtitle?: string;

  @ApiProperty({ enum: ['studio', 'taylors_version', 'ep', 'compilation'] })
  type!: 'studio' | 'taylors_version' | 'ep' | 'compilation';

  @ApiProperty({ description: 'Slug of the era this album belongs to.', example: 'lover' })
  era!: string;

  @ApiProperty({ description: 'Release date in ISO-8601 (YYYY-MM-DD).', example: '2019-08-23' })
  releaseDate!: string;

  @ApiProperty({ type: [String] })
  producers!: string[];

  @ApiProperty({ type: [String] })
  writers!: string[];

  @ApiProperty({ example: 'Republic Records' })
  label!: string;

  @ApiProperty({ example: 18 })
  totalTracks!: number;

  @ApiPropertyOptional({ description: 'Total runtime in seconds, if known.' })
  durationSeconds?: number;

  @ApiProperty({ type: TaylorsVersionDto })
  taylorsVersion!: TaylorsVersionDto;

  @ApiPropertyOptional({ description: 'MusicBrainz release-group identifier.' })
  musicbrainzReleaseGroupId?: string;

  @ApiPropertyOptional({ description: 'Spotify album identifier.' })
  spotifyAlbumId?: string;

  @ApiProperty({ type: CoverArtDto })
  coverArt!: CoverArtDto;

  @ApiProperty({ description: 'Long-form description of the album.' })
  description!: string;

  @ApiProperty({ type: [String], description: 'Notable trivia about the album.' })
  trivia!: string[];
}
