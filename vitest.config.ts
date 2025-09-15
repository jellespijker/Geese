import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup/testSetup.ts'],
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    coverage: { enabled: false },
  },
  resolve: {
    alias: {
      '@electron': '/electron',
    },
  },
});

