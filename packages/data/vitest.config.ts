import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.spec.ts'],
    exclude: ['test/_setup.ts'],
    globalSetup: ['test/_setup.ts'],
    testTimeout: 10_000,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/__generated__/**', 'src/data/**', 'src/loaders/data/**', 'src/index.ts'],
      thresholds: { lines: 70 },
    },
  },
});
