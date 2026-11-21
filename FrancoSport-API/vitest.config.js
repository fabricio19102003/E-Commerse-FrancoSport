import { defineConfig } from 'vitest/config';
import { testEnv } from './tests/test-env.js';

export default defineConfig({
  test: {
    env: testEnv,
    globalSetup: ['./tests/global-setup.js'],
    include: ['tests/**/*.test.js'],
    // All files share one database
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 60000,
  },
});
