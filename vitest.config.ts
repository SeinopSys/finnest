import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';
import UnpluginTypia from '@ryoppippi/unplugin-typia/vite';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts', 'test/**/*.e2e-spec.ts'],
    coverage: {
      provider: 'v8',
      reportsDirectory: 'coverage',
      thresholds: {
        statements: 48,
        branches: 13,
        functions: 41,
        lines: 48,
      },
    },
  },
  plugins: [
    // This is required to build the test files with SWC
    swc.vite({
      // Explicitly set the module type to avoid inheriting this value from a `.swcrc` config file
      module: { type: 'es6' },
    }),
    UnpluginTypia({
      /* options */
    }),
  ],
});
