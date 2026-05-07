import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const packageRoot = join(here, '..');
const albumsDir = join(packageRoot, 'src/data/albums');
const outDir = join(packageRoot, 'src/__generated__');
const outFile = join(outDir, 'album-index.ts');

export async function generateAlbumIndex(): Promise<readonly string[]> {
  const entries = await readdir(albumsDir);
  const slugs = entries
    .filter((name) => name.endsWith('.json'))
    .map((name) => name.slice(0, -'.json'.length))
    .sort((a, b) => a.localeCompare(b));

  const literals = slugs.map((slug) => `  '${slug}'`).join(',\n');
  const contents = `// AUTO-GENERATED. DO NOT EDIT.
// Source: src/data/albums/*.json
// Regenerate via the tsdown build (build:prepare hook) or \`tsx scripts/generate-album-index.ts\`.

export const ALBUM_SLUGS = [
${literals},
] as const;

export type AlbumSlug = (typeof ALBUM_SLUGS)[number];
`;

  await mkdir(outDir, { recursive: true });
  await writeFile(outFile, contents, 'utf8');
  return slugs;
}

const isDirectInvocation = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isDirectInvocation) {
  generateAlbumIndex().then((slugs) => {
    console.log(`Generated album-index.ts with ${slugs.length} slugs.`);
  });
}
