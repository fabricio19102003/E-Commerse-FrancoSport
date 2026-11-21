import { describe, it, expect } from 'vitest';
import { assertSafeTestDatabaseUrl } from './db-guard.js';

describe('test database guard', () => {
  it.each([
    'mysql://root:test@127.0.0.1:33306/fs_test',
    'mysql://root:test@localhost:3306/test',
    'mysql://root:test@localhost:3306/test_orders',
  ])('accepts %s', (url) => {
    expect(() => assertSafeTestDatabaseUrl(url)).not.toThrow();
  });

  it.each([
    ['mysql://root:x@db.example.com:3306/fs_test', /host/i],
    ['mysql://root:x@10.0.0.5:3306/fs_test', /host/i],
    ['mysql://root:x@127.0.0.1:3306/francosport', /nombre|name/i],
    ['mysql://root:x@127.0.0.1:3306/latest', /nombre|name/i],
    ['mysql://root:x@127.0.0.1:3306/contest_prod', /nombre|name/i],
    ['not a url', /URL/],
  ])('refuses %s', (url, reason) => {
    expect(() => assertSafeTestDatabaseUrl(url)).toThrow(reason);
  });
});
