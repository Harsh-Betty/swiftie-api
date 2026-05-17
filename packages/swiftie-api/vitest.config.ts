import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.spec.ts', 'test/**/*.spec.ts'],
    testTimeout: 10_000,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        'src/__generated__/**',
        'src/**/*.spec.ts',
        'src/index.ts',
        'src/shared/types.ts',
        'src/client/types.ts',
        // searchLyrics dynamically imports `dist/albums/<slug>.js`; that path
        // doesn't exist alongside the source files, so coverage of this module
        // can only be measured against the published build.
        'src/offline/lyrics.ts',
      ],
      thresholds: { lines: 80 },
    },
  },
});
