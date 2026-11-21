/**
 * Test environment (throwaway values, not real credentials)
 *
 * The database is a local throwaway MySQL container (see README, "Pruebas").
 * Override with TEST_DATABASE_URL; the name must contain "test" because the
 * suite resets the schema with `prisma db push --force-reset`.
 */
export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL || 'mysql://root:test@127.0.0.1:33306/fs_test';

export const testEnv = {
  NODE_ENV: 'test',
  DATABASE_URL: TEST_DATABASE_URL,
  JWT_SECRET: 'test-jwt-secret',
  JWT_REFRESH_SECRET: 'test-jwt-refresh-secret',
};
