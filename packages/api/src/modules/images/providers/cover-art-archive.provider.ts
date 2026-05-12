import { Injectable } from '@nestjs/common';
import type { ImageProvider, ImageQueryContext, ImageResult } from './image-provider.interface';

const CAA_BASE = 'https://coverartarchive.org';
const LICENSE_URL = 'https://musicbrainz.org/doc/Cover_Art_Archive';

@Injectable()
export class CoverArtArchiveProvider implements ImageProvider {
  readonly id = 'cover-art-archive';
  readonly missingEnv: readonly string[] = [];
  readonly supportsSearch = false;

  isAvailable(): boolean {
    return true;
  }

  async fetch(ctx: ImageQueryContext): Promise<ImageResult[]> {
    const mbid = ctx.album?.mbid;
    if (!mbid) return [];

    const full = `${CAA_BASE}/release-group/${mbid}/front-1200`;
    const thumb = `${CAA_BASE}/release-group/${mbid}/front-500`;

    return [
      {
        url: full,
        thumbnailUrl: thumb,
        width: 1200,
        height: 1200,
        source: this.id,
        sourceUrl: `https://musicbrainz.org/release-group/${mbid}`,
        attribution: {
          license: 'Various (per-image, see Cover Art Archive)',
          licenseUrl: LICENSE_URL,
        },
        meta: { thumbnail: { width: 500, height: 500 } },
      },
    ];
  }
}
