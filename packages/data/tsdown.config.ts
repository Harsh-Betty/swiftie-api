import { cp, rm } from 'node:fs/promises';
import { defineConfig } from 'tsdown';
import { generateAlbumIndex } from './scripts/generate-album-index';

let copyDataPromise: Promise<void> | null = null;
const copyDataOnce = (outDir: string, cleanData: boolean): Promise<void> => {
  if (!copyDataPromise) {
    const dest = `${outDir}/data`;
    copyDataPromise = (async () => {
      if (cleanData) {
        await rm(dest, { recursive: true, force: true });
      }
      await cp('src/data', dest, { recursive: true, force: true });
    })();
  }
  return copyDataPromise;
};

export default defineConfig((options) => {
  const isWatch = Boolean(options.watch);

  return {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    clean: !isWatch,
    target: 'node20',
    deps: {
      neverBundle: [/\.json$/],
    },
    hooks: {
      'build:prepare': async () => {
        copyDataPromise = null;
        await generateAlbumIndex();
      },
      'build:done': async (ctx) => {
        await copyDataOnce(ctx.options.outDir ?? 'dist', !isWatch);
      },
    },
  };
});
