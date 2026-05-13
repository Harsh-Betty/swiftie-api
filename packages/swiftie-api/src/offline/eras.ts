import { ERAS } from '../__generated__/meta.js';
import type { Era } from '../shared/types.js';

export function getAllEras(): Era[] {
  return [...ERAS];
}

export function getEra(slug: string): Era {
  const era = ERAS.find((e) => e.slug === slug);
  if (!era) {
    throw new Error(`Era with slug "${slug}" was not found.`);
  }
  return era;
}
