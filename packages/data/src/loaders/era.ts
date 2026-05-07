import * as z from 'zod';
import { type Era, EraSchema } from '../schemas/era';

let cache: Era[] | null = null;

const EraArraySchema = z.array(EraSchema);

export async function getEras(): Promise<Era[]> {
  if (cache) return cache;
  const path: string = './data/eras.json';
  const mod = (await import(path, { with: { type: 'json' } })) as { default: unknown };
  cache = EraArraySchema.parse(mod.default);
  return cache;
}

export async function getEra(slug: string): Promise<Era> {
  const eras = await getEras();
  const era = eras.find((e) => e.slug === slug);
  if (!era) {
    throw new Error(`Era with slug "${slug}" was not found.`);
  }
  return era;
}
