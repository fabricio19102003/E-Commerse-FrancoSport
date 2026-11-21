import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import { api, prisma } from './helpers.js';
import { TEST_DATABASE_URL } from './test-env.js';
import { assertSafeTestDatabaseUrl } from './db-guard.js';

const API_DIR = fileURLToPath(new URL('..', import.meta.url));
const ADMIN = 'admin@francosport.com';
const CUSTOMER = 'cliente@francosport.com';
const SEED_SKUS = ['ELC-001', 'RRB-002', 'WCS-003', 'PP86-004'];
const SEED_COUPONS = ['FRANCO20', 'ENVIOGRATIS'];
const SEED_SLUGS = { category: ['elite', 'pro', 'sport'], brand: ['franco-sport', 'racing-elite', 'legacy'] };

// Runs the real seed script (`npm run db:seed`) against the throwaway test database
const runSeed = (env = {}) =>
  spawnSync(process.execPath, ['prisma/seed.js'], {
    cwd: API_DIR,
    encoding: 'utf8',
    env: {
      ...process.env,
      DATABASE_URL: TEST_DATABASE_URL,
      NODE_ENV: 'test',
      SEED_ADMIN_PASSWORD: '',
      SEED_USER_PASSWORD: '',
      ...env,
    },
  });

const seedOk = (env) => {
  const result = runSeed(env);
  expect(result.status, result.stderr).toBe(0);
  return result;
};

// Other test files share this database: remove only what the seed creates
const removeSeedData = async () => {
  const zone = await prisma.shippingZone.findMany({ where: { name: 'Bolivia' }, select: { id: true } });
  await prisma.shippingMethod.deleteMany({ where: { shipping_zone_id: { in: zone.map((z) => z.id) } } });
  await prisma.shippingZone.deleteMany({ where: { name: 'Bolivia' } });
  await prisma.coupon.deleteMany({ where: { code: { in: SEED_COUPONS } } });
  await prisma.product.deleteMany({ where: { sku: { in: SEED_SKUS } } });
  await prisma.category.deleteMany({ where: { slug: { in: SEED_SLUGS.category } } });
  await prisma.brand.deleteMany({ where: { slug: { in: SEED_SLUGS.brand } } });
  await prisma.paymentConfig.deleteMany({ where: { method_name: 'BANK_TRANSFER' } });
  await prisma.user.deleteMany({ where: { email: { in: [ADMIN, CUSTOMER] } } });
};

const counts = async () => ({
  users: await prisma.user.count({ where: { email: { in: [ADMIN, CUSTOMER] } } }),
  categories: await prisma.category.count({ where: { slug: { in: SEED_SLUGS.category } } }),
  brands: await prisma.brand.count({ where: { slug: { in: SEED_SLUGS.brand } } }),
  products: await prisma.product.count({ where: { sku: { in: SEED_SKUS } } }),
  images: await prisma.productImage.count({ where: { product: { sku: { in: SEED_SKUS } } } }),
  zones: await prisma.shippingZone.count({ where: { name: 'Bolivia' } }),
  methods: await prisma.shippingMethod.count({ where: { shipping_zone: { name: 'Bolivia' } } }),
  coupons: await prisma.coupon.count({ where: { code: { in: SEED_COUPONS } } }),
  paymentConfigs: await prisma.paymentConfig.count({ where: { method_name: 'BANK_TRANSFER' } }),
});

const login = (email, password) => api.post('/api/auth/login', null, { email, password });

describe('seed (npm run db:seed)', () => {
  beforeAll(async () => {
    assertSafeTestDatabaseUrl(TEST_DATABASE_URL);
    await removeSeedData();
  });
  afterAll(async () => {
    await removeSeedData();
  });

  it('creates an active ADMIN and a verified CUSTOMER with the passwords from the environment', async () => {
    seedOk({ SEED_ADMIN_PASSWORD: 'Admin-Seed-1', SEED_USER_PASSWORD: 'Cliente-Seed-1' });

    const admin = await prisma.user.findUnique({ where: { email: ADMIN } });
    expect(admin).toMatchObject({ role: 'ADMIN', is_active: true, email_verified: true });
    const customer = await prisma.user.findUnique({ where: { email: CUSTOMER } });
    expect(customer).toMatchObject({ role: 'CUSTOMER', is_active: true, email_verified: true });

    const adminLogin = await login(ADMIN, 'Admin-Seed-1');
    expect(adminLogin.status).toBe(200);
    expect(adminLogin.body.data.user).toMatchObject({ email: ADMIN, role: 'ADMIN' });
    expect((await login(CUSTOMER, 'Cliente-Seed-1')).status).toBe(200);
    // The documented fallback is not applied when the variable is set
    expect((await login(ADMIN, 'admin123')).status).toBe(401);
  });

  it('creates the catalog, shipping, payment configuration and coupons', async () => {
    expect(await counts()).toEqual({
      users: 2,
      categories: 3,
      brands: 3,
      products: 4,
      images: 4,
      zones: 1,
      methods: 2,
      coupons: 2,
      paymentConfigs: 1,
    });
    const products = await prisma.product.findMany({ where: { sku: { in: SEED_SKUS } } });
    for (const product of products) {
      expect(product.stock).toBeGreaterThan(0);
      expect(Number(product.weight)).toBeGreaterThan(0);
      expect(product.is_active).toBe(true);
    }
    const coupons = await prisma.coupon.findMany({ where: { code: { in: SEED_COUPONS } } });
    expect(coupons.map((c) => c.discount_type).sort()).toEqual(['FREE_SHIPPING', 'PERCENTAGE']);
  });

  it('running it again succeeds and changes no counts', async () => {
    const before = await counts();
    const second = seedOk({ SEED_ADMIN_PASSWORD: 'Admin-Seed-1', SEED_USER_PASSWORD: 'Cliente-Seed-1' });
    expect(second.stderr).not.toContain('Error');
    expect(await counts()).toEqual(before);
    seedOk({ SEED_ADMIN_PASSWORD: 'Admin-Seed-1', SEED_USER_PASSWORD: 'Cliente-Seed-1' });
    expect(await counts()).toEqual(before);
    expect((await login(ADMIN, 'Admin-Seed-1')).status).toBe(200);
  });

  it('never resets a password or data the owner changed', async () => {
    const changedHash = await bcrypt.hash('Cambiada-Por-Admin-9', 4);
    await prisma.user.update({ where: { email: ADMIN }, data: { password_hash: changedHash } });
    await prisma.product.update({ where: { sku: 'ELC-001' }, data: { stock: 3, price: '199.00' } });
    await prisma.coupon.update({ where: { code: 'FRANCO20' }, data: { times_used: 7, is_active: false } });
    await prisma.paymentConfig.update({ where: { method_name: 'BANK_TRANSFER' }, data: { instructions: 'Cuenta real' } });

    seedOk({ SEED_ADMIN_PASSWORD: 'Admin-Seed-1', SEED_USER_PASSWORD: 'Cliente-Seed-1' });

    expect((await prisma.user.findUnique({ where: { email: ADMIN } })).password_hash).toBe(changedHash);
    expect((await login(ADMIN, 'Cambiada-Por-Admin-9')).status).toBe(200);
    expect((await login(ADMIN, 'Admin-Seed-1')).status).toBe(401);
    expect(await prisma.product.findUnique({ where: { sku: 'ELC-001' } })).toMatchObject({ stock: 3 });
    expect(Number((await prisma.product.findUnique({ where: { sku: 'ELC-001' } })).price)).toBe(199);
    expect(await prisma.coupon.findUnique({ where: { code: 'FRANCO20' } })).toMatchObject({ times_used: 7, is_active: false });
    expect((await prisma.paymentConfig.findUnique({ where: { method_name: 'BANK_TRANSFER' } })).instructions).toBe('Cuenta real');
  });

  it('outside production, without the variables, uses the documented local passwords (admin123 / user123)', async () => {
    await removeSeedData();
    seedOk();
    expect((await login(ADMIN, 'admin123')).status).toBe(200);
    expect((await login(CUSTOMER, 'user123')).status).toBe(200);
  });

  it('in production it refuses to run without SEED_ADMIN_PASSWORD and SEED_USER_PASSWORD and writes nothing', async () => {
    await removeSeedData();
    const result = runSeed({ NODE_ENV: 'production' });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('SEED_ADMIN_PASSWORD and SEED_USER_PASSWORD must be set');
    expect(await counts()).toEqual({
      users: 0,
      categories: 0,
      brands: 0,
      products: 0,
      images: 0,
      zones: 0,
      methods: 0,
      coupons: 0,
      paymentConfigs: 0,
    });
  });
});
