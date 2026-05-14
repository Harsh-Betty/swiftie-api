import { apiData } from './api';

export interface Era {
  slug: string;
  name: string;
  displayName: string;
  color: string;
  description: string;
  startDate: string;
  endDate: string | null;
  albumSlugs: string[];
  iconographyKeywords: string[];
}

const FALLBACK_COLORS: Record<string, string> = {
  debut: '#5b9279',
  fearless: '#d4a017',
  'speak-now': '#5a3a87',
  red: '#b32d2e',
  '1989': '#aac9e0',
  reputation: '#1a1a1a',
  lover: '#ffb6c1',
  folklore: '#8b8680',
  evermore: '#a0522d',
  midnights: '#1a2b4a',
  'the-tortured-poets-department': '#c8b394',
};

let cache: Era[] | null = null;
let inflight: Promise<Era[]> | null = null;

export async function loadEras(): Promise<Era[]> {
  if (cache) return cache;
  if (inflight) return inflight;

  inflight = apiData<Era[]>('/eras')
    .then((eras) => {
      cache = eras;
      return eras;
    })
    .catch((err) => {
      inflight = null;
      throw err;
    });

  return inflight;
}

export function getCachedEras(): Era[] | null {
  return cache;
}

export function getEraColor(slug: string): string {
  const era = cache?.find((e) => e.slug === slug);
  return era?.color ?? FALLBACK_COLORS[slug] ?? '#1a2b4a';
}
