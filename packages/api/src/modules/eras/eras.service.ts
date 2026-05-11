import { Injectable, NotFoundException } from '@nestjs/common';
import { type Era, getAlbum, getEra, getEras } from '@swiftie-api/data';
import { assertSlug } from '../../common/util/assert-slug';
import type { EraDetailResponseDto } from './dto/era-detail-response.dto';

@Injectable()
export class ErasService {
  list(): Promise<Era[]> {
    return getEras();
  }

  async findOne(slug: string): Promise<EraDetailResponseDto> {
    assertSlug(slug, 'Era slug');
    let era: Era;
    try {
      era = await getEra(slug);
    } catch {
      throw new NotFoundException(`Era with slug "${slug}" was not found.`);
    }
    const albums = await Promise.all(era.albumSlugs.map((s) => getAlbum(s)));
    return { ...era, albums };
  }
}
