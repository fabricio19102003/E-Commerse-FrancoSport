import { describe, it, expect, afterEach } from 'vitest';
import request from 'supertest';
import { createApp, parseTrustProxy } from '../src/app.js';
import { createUser, createContext, prisma } from './helpers.js';

// A fresh app per test: every limiter has its own in-memory counter
const limited = (options = {}) => createApp({ rateLimits: { enabled: true }, ...options });

const login = (app, email, ip) => {
  const req = request(app).post('/api/auth/login');
  if (ip) req.set('X-Forwarded-For', ip);
  return req.send({ email, password: 'wrong-password' });
};

const GLOBAL_MESSAGE = 'Demasiadas peticiones desde esta IP, por favor intente de nuevo después de 15 minutos';
const AUTH_MESSAGE = 'Demasiados intentos de autenticación desde esta IP; intente de nuevo en 15 minutos';
const EMAIL_MESSAGE = 'Demasiados intentos con este correo; intente de nuevo en 15 minutos';
const ORDER_MESSAGE = 'Demasiados pedidos en poco tiempo; intente de nuevo en 15 minutos';

describe('global limit', () => {
  it('allows 600 requests per IP and answers 429 in Spanish on the 601st', async () => {
    const app = limited();
    for (let i = 0; i < 600; i++) expect((await request(app).get('/api/health')).status).toBe(200);

    const res = await request(app).get('/api/health');
    expect(res.status).toBe(429);
    expect(res.body).toEqual({ success: false, error: { code: 'TOO_MANY_REQUESTS', message: GLOBAL_MESSAGE } });
    expect(res.headers['ratelimit-policy']).toBe('600;w=900');
  });
});

describe('login, register and refresh', () => {
  it('login: 10 attempts per IP per 15 minutes, then 429', async () => {
    const app = limited();
    for (let i = 0; i < 10; i++) expect((await login(app, `nadie-${i}@test.local`)).status).toBe(401);

    const res = await login(app, 'otro@test.local');
    expect(res.status).toBe(429);
    expect(res.body).toEqual({ success: false, error: { code: 'RATE_LIMITED', message: AUTH_MESSAGE } });
  });

  it('login: 10 attempts per email even from different IPs; other emails are not affected', async () => {
    const app = limited({ trustProxy: 1 });
    for (let i = 0; i < 10; i++) expect((await login(app, 'victima@test.local', `10.1.0.${i}`)).status).toBe(401);

    const res = await login(app, 'VICTIMA@test.local', '10.1.0.99');
    expect(res.status).toBe(429);
    expect(res.body).toEqual({ success: false, error: { code: 'RATE_LIMITED', message: EMAIL_MESSAGE } });

    expect((await login(app, 'otra@test.local', '10.1.0.99')).status).toBe(401);
  });

  it('register: 10 attempts per IP, then 429 (invalid attempts count too)', async () => {
    const app = limited();
    for (let i = 0; i < 10; i++) {
      const res = await request(app).post('/api/auth/register').send({ email: `x-${i}@test.local` });
      expect(res.status).toBe(400);
    }
    const res = await request(app).post('/api/auth/register').send({ email: 'x-11@test.local' });
    expect(res.status).toBe(429);
    expect(res.body.error).toEqual({ code: 'RATE_LIMITED', message: AUTH_MESSAGE });
  });

  it('register: 10 attempts per email even from different IPs', async () => {
    const app = limited({ trustProxy: 1 });
    const attempt = (ip) =>
      request(app).post('/api/auth/register').set('X-Forwarded-For', ip).send({ email: 'mismo@test.local' });
    for (let i = 0; i < 10; i++) expect((await attempt(`10.2.0.${i}`)).status).toBe(400);

    const res = await attempt('10.2.0.99');
    expect(res.status).toBe(429);
    expect(res.body.error).toEqual({ code: 'RATE_LIMITED', message: EMAIL_MESSAGE });
  });

  it('refresh: 10 attempts per IP, then 429', async () => {
    const app = limited();
    const attempt = () => request(app).post('/api/auth/refresh').send({ refreshToken: 'no-es-un-token' });
    for (let i = 0; i < 10; i++) expect((await attempt()).status).toBe(401);

    const res = await attempt();
    expect(res.status).toBe(429);
    expect(res.body.error).toEqual({ code: 'RATE_LIMITED', message: AUTH_MESSAGE });
  });

  it('login, register and refresh are counted separately', async () => {
    const app = limited();
    for (let i = 0; i < 10; i++) await login(app, `nadie-${i}@test.local`);
    expect((await login(app, 'nadie-x@test.local')).status).toBe(429);

    expect((await request(app).post('/api/auth/refresh').send({ refreshToken: 'x' })).status).toBe(401);
    expect((await request(app).post('/api/auth/register').send({})).status).toBe(400);
  });
});

describe('order creation', () => {
  it('20 attempts per user per 15 minutes, then 429; other users are not affected', async () => {
    const app = limited();
    const { token } = await createUser();
    const other = await createUser();
    const attempt = (t) => request(app).post('/api/orders').set('Authorization', `Bearer ${t}`).send({});
    for (let i = 0; i < 20; i++) expect((await attempt(token)).status).toBe(400);

    const res = await attempt(token);
    expect(res.status).toBe(429);
    expect(res.body).toEqual({ success: false, error: { code: 'RATE_LIMITED', message: ORDER_MESSAGE } });

    expect((await attempt(other.token)).status).toBe(400);
  });

  it('a limited order request creates nothing', async () => {
    const app = limited();
    const ctx = await createContext({ product: { stock: 100 } });
    const body = {
      items: [{ product_id: ctx.product.id, quantity: 1 }],
      shipping_address_id: ctx.address.id,
      shipping_method_id: ctx.method.id,
      payment_method: 'CASH_ON_DELIVERY',
    };
    const attempt = () => request(app).post('/api/orders').set('Authorization', `Bearer ${ctx.token}`).send(body);
    for (let i = 0; i < 20; i++) expect((await attempt()).status).toBe(201);
    const limitedRes = await attempt();
    expect(limitedRes.status).toBe(429);
    expect(await prisma.order.count({ where: { user_id: ctx.user.id } })).toBe(20);
    expect((await prisma.product.findUnique({ where: { id: ctx.product.id } })).stock).toBe(80);
  });
});

describe('trust proxy', () => {
  it('unset: X-Forwarded-For is ignored, every client counts as the same IP', async () => {
    const app = limited();
    for (let i = 0; i < 10; i++) expect((await login(app, `u-${i}@test.local`, `10.3.0.${i}`)).status).toBe(401);
    expect((await login(app, 'u-x@test.local', '10.3.0.200')).status).toBe(429);
  });

  it('set (1): each X-Forwarded-For client is counted on its own', async () => {
    const app = limited({ trustProxy: 1 });
    for (let i = 0; i < 10; i++) expect((await login(app, `a-${i}@test.local`, '10.4.0.1')).status).toBe(401);
    expect((await login(app, 'a-x@test.local', '10.4.0.1')).status).toBe(429);

    expect((await login(app, 'b-0@test.local', '10.4.0.2')).status).toBe(401);
  });

  describe('TRUST_PROXY env var', () => {
    const original = process.env.TRUST_PROXY;
    afterEach(() => {
      if (original === undefined) delete process.env.TRUST_PROXY;
      else process.env.TRUST_PROXY = original;
    });

    it('is honored by default when the app is created', async () => {
      process.env.TRUST_PROXY = '1';
      const app = limited();
      for (let i = 0; i < 10; i++) expect((await login(app, `e-${i}@test.local`, '10.5.0.1')).status).toBe(401);
      expect((await login(app, 'e-x@test.local', '10.5.0.1')).status).toBe(429);
      expect((await login(app, 'f-0@test.local', '10.5.0.2')).status).toBe(401);
    });

    it('is ignored when unset', async () => {
      delete process.env.TRUST_PROXY;
      const app = limited();
      for (let i = 0; i < 10; i++) expect((await login(app, `g-${i}@test.local`, `10.6.0.${i}`)).status).toBe(401);
      expect((await login(app, 'g-x@test.local', '10.6.0.200')).status).toBe(429);
    });
  });

  it('parseTrustProxy: unset/empty/false -> false, digits -> number, anything else passes through', () => {
    expect(parseTrustProxy(undefined)).toBe(false);
    expect(parseTrustProxy('')).toBe(false);
    expect(parseTrustProxy('false')).toBe(false);
    expect(parseTrustProxy('1')).toBe(1);
    expect(parseTrustProxy('2')).toBe(2);
    expect(parseTrustProxy('loopback')).toBe('loopback');
  });
});

describe('the normal test app', () => {
  it('keeps the limiters off (NODE_ENV=test)', async () => {
    const { default: app } = await import('../src/app.js');
    for (let i = 0; i < 15; i++) expect((await login(app, `n-${i}@test.local`)).status).toBe(401);
  });
});
