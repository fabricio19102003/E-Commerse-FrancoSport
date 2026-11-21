import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createUser } from './helpers.js';

const COUPON_MESSAGE = 'Demasiadas validaciones de cupón; intente de nuevo en 15 minutos';

const validate = (app, token, code = 'NO-EXISTE') =>
  request(app).post('/api/coupons/validate').set('Authorization', `Bearer ${token}`).send({ code });

describe('POST /api/coupons/validate rate limit (S5)', () => {
  it('allows 30 validations per user per 15 minutes, then 429 in Spanish', async () => {
    const app = createApp({ rateLimits: { enabled: true } });
    const ctx = await createUser();

    for (let i = 0; i < 30; i++) {
      // Empty cart: answered 400 by the controller, which is not the limiter
      expect((await validate(app, ctx.token)).status).toBe(400);
    }

    const res = await validate(app, ctx.token);
    expect(res.status).toBe(429);
    expect(res.body).toEqual({ success: false, error: { code: 'RATE_LIMITED', message: COUPON_MESSAGE } });
    expect(res.headers['ratelimit-policy']).toBe('30;w=900');
  });

  it('counts per user: another customer is not affected', async () => {
    const app = createApp({ rateLimits: { enabled: true } });
    const first = await createUser();
    const second = await createUser();
    for (let i = 0; i < 30; i++) await validate(app, first.token);

    expect((await validate(app, first.token)).status).toBe(429);
    expect((await validate(app, second.token)).status).not.toBe(429);
  });

  it('is off when the limits are disabled (default under NODE_ENV=test)', async () => {
    const app = createApp();
    const { token } = await createUser();
    for (let i = 0; i < 31; i++) expect((await validate(app, token)).status).not.toBe(429);
  });
});
