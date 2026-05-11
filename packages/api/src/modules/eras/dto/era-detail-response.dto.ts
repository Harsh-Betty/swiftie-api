import { ApiProperty } from '@nestjs/swagger';
import { AlbumResponseDto } from '../../albums/dto/album-response.dto';
import { EraResponseDto } from './era-response.dto';

export class EraDetailResponseDto extends EraResponseDto {
  @ApiProperty({
    type: [AlbumResponseDto],
    description: 'Albums in this era, hydrated from their slugs.',
  })
  albums!: AlbumResponseDto[];
}
