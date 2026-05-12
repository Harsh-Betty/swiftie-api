export type ImageQueryContext = {
  album?: { slug: string; title: string; mbid?: string; spotifyId?: string };
  song?: { slug: string; title: string };
  query?: string;
  limit: number;
};

export type ImageResult = {
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  source: string;
  sourceUrl?: string;
  attribution: {
    author?: string;
    authorUrl?: string;
    license?: string;
    licenseUrl?: string;
  };
  meta?: Record<string, unknown>;
};

export interface ImageProvider {
  readonly id: string;
  readonly missingEnv: readonly string[];
  readonly supportsSearch: boolean;
  isAvailable(): boolean;
  fetch(ctx: ImageQueryContext): Promise<ImageResult[]>;
}
