import { execFileSync } from 'node:child_process';
import { TEST_DATABASE_URL } from './test-env.js';
import { assertSafeTestDatabaseUrl } from './db-guard.js';

/**
 * Reset the throwaway test database to the current Prisma schema.
 * Refuses to run against anything that is not a local test database.
 */
export default function setup() {
  assertSafeTestDatabaseUrl(TEST_DATABASE_URL);

  execFileSync('npx', ['prisma', 'db', 'push', '--force-reset', '--skip-generate', '--accept-data-loss'], {
    stdio: 'pipe',
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
  });
}
