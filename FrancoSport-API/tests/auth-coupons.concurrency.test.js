import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { sendMail } = vi.hoisted(() => ({ sendMail: vi.fn() }));
vi.mock('../src/config/email.js', () => ({ transporter: { sendMail } }));

import {
  api,
  prisma,
  createUser,
  createAddress,
  createProduct,
  createShippingMethod,
  linkToken,
} from './helpers.js';

beforeEach(() => {
  sendMail.mockReset();
  sendMail.mockResolvedValue({ messageId: 'test' });
  vi.stubEnv('FRONTEND_URL', 'https://tienda.test');
});
afterEach(() => vi.unstubAllEnvs());

const mailLink = async (email, path) => {
  await vi.waitFor(() =>
    expect(sendMail.mock.calls.map(([m]) => m).find((m) => m.to === email && linkToken(m.html, path))).toBeDefined()
  );
  const mail = sendMail.mock.calls.map(([m]) => m).find((m) => m.to === email && linkToken(m.html, path));
  return linkToken(mail.html, path).token;
};

const statuses = (responses) => responses.map((r) => r.status).sort((a, b) => a - b);

describe('concurrent single-use tokens (S3, S4)', () => {
  it('5 concurrent resets with one token: exactly one 200, the rest 400, one final password', async () => {
    const { user } = await createUser({ password: 'old-password-1' });
    expect((await api.post('/api/auth/forgot-password', null, { email: user.email })).status).toBe(200);
    const token = await mailLink(user.email, '/restablecer-contrasena');

    const responses = await Promise.all(
      Array.from({ length: 5 }, (_, i) => api.post('/api/auth/reset-password', null, { token, password: `new-password-${i}` }))
    );

    expect(statuses(responses)).toEqual([200, 400, 400, 400, 400]);
    const winner = responses.findIndex((r) => r.status === 200);
    expect((await api.post('/api/auth/login', null, { email: user.email, password: `new-password-${winner}` })).status).toBe(200);
    expect((await api.post('/api/auth/login', null, { email: user.email, password: 'old-password-1' })).status).toBe(401);
  });

  it('5 concurrent verifications with one token: exactly one 200, the rest 400', async () => {
    const { user, token: jwt } = await createUser({ emailVerified: false });
    expect((await api.post('/api/auth/resend-verification', jwt)).status).toBe(200);
    const token = await mailLink(user.email, '/verificar-correo');

    const responses = await Promise.all(Array.from({ length: 5 }, () => api.post('/api/auth/verify-email', null, { token })));

    expect(statuses(responses)).toEqual([200, 400, 400, 400, 400]);
    expect((await prisma.user.findUnique({ where: { id: user.id } })).email_verified).toBe(true);
  });
});

describe('concurrent coupon use (S5)', () => {
  it('total limit 3 with 8 concurrent customers: three 201, five rejected, times_used 3', async () => {
    const coupon = await prisma.coupon.create({
      data: {
        code: `CC${Date.now().toString(36)}`.toUpperCase(),
        description: 'Concurrencia',
        discount_type: 'FIXED_AMOUNT',
        discount_value: '1.00',
        usage_limit_total: 3,
        starts_at: new Date(Date.now() - 86400e3),
        expires_at: new Date(Date.now() + 86400e3),
      },
    });
    const product = await createProduct({ stock: 50 });
    const method = await createShippingMethod();
    const buyers = await Promise.all(
      Array.from({ length: 8 }, async () => {
        const { user, token } = await createUser();
        return { user, token, address: await createAddress(user.id) };
      })
    );

    const responses = await Promise.all(
      buyers.map((b) =>
        api.post('/api/orders', b.token, {
          items: [{ product_id: product.id, quantity: 1 }],
          shipping_address_id: b.address.id,
          shipping_method_id: method.id,
          payment_method: 'CASH_ON_DELIVERY',
          coupon_code: coupon.code,
        })
      )
    );

    expect(responses.filter((r) => r.status === 201)).toHaveLength(3);
    for (const r of responses.filter((r) => r.status !== 201)) {
      expect(r.status).toBe(400);
      expect(r.body.error.code).toBe('COUPON_LIMIT_REACHED');
    }
    expect((await prisma.coupon.findUnique({ where: { id: coupon.id } })).times_used).toBe(3);
    expect(await prisma.order.count({ where: { coupon_id: coupon.id } })).toBe(3);
    expect((await prisma.product.findUnique({ where: { id: product.id } })).stock).toBe(47);
  });
});
