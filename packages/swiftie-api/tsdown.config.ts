import { readdirSync } from 'node:fs';
import { defineConfig } from 'tsdown';

import { generateBundledData } from './scripts/generate-bundled-data';

const albumsSourceDir = '../data/src/data/albums';
const slugs = readdirSync(albumsSourceDir)
  .filter((f) => f.endsWith('.json'))
  .map((f) => f.slice(0, -'.json'.length))
  .sort((a, b) => a.localeCompare(b));

const perAlbumEntries: Record<string, string> = Object.fromEntries(
  slugs.map((slug) => [`albums/${slug}`, `src/__generated__/albums/${slug}.ts`]),
);

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    ...perAlbumEntries,
  },
  format: ['esm', 'cjs'],
  outExtensions: ({ format }) => ({ js: format === 'es' ? '.js' : '.cjs' }),
  dts: true,
  target: 'node18',
  platform: 'neutral',
  clean: true,
  treeshake: true,
  sourcemap: true,
  publint: true,
  attw: true,
  hooks: {
    'build:prepare': async () => {
      await generateBundledData();
    },
  },
});
