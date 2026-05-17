import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['src/**/*.spec.ts'],
    testTimeout: 10_000,
    coverage: {
      provider: 'v8',
      // Unit specs cover services and provider/http internals. Controllers and
      // module wiring live behind the Nest DI graph and are exercised by the
      // separate e2e suite; gating threshold here on services/providers keeps
      // the unit-coverage signal honest.
      include: [
        'src/modules/**/*.service.ts',
        'src/modules/images/providers/**/*.ts',
        'src/modules/images/http/**/*.ts',
        'src/modules/images/cache/**/*.ts',
      ],
      exclude: [
        'src/**/*.spec.ts',
        'src/**/*.module.ts',
        'src/**/dto/**',
        'src/modules/images/providers/image-provider.interface.ts',
        'src/modules/images/providers/provider-registry.ts',
      ],
      thresholds: { lines: 60 },
    },
  },
  plugins: [swc.vite({ module: { type: 'es6' } })],
});
