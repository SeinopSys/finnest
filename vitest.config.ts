import UnpluginTypia from '@ryoppippi/unplugin-typia/vite';
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts', 'test/**/*.e2e-spec.ts'],
    setupFiles: ['./test/setup.ts'],
    globalSetup: ['./test/global-setup.ts'],
    coverage: {
      provider: 'v8',
      reportsDirectory: 'coverage',
      exclude: ['src/generated/**', '**/*.module.ts', 'src/main.ts', 'test/**'],
      thresholds: {
        statements: 97,
        branches: 55,
        functions: 93,
        lines: 98,
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
