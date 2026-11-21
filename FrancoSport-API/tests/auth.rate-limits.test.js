import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// Only the email transport is mocked: nothing here may reach a real mailbox
const { sendMail } = vi.hoisted(() => ({ sendMail: vi.fn() }));
vi.mock('../src/config/email.js', () => ({ transporter: { sendMail } }));

import { createApp } from '../src/app.js';
import { createUser } from './helpers.js';

beforeEach(() => {
  sendMail.mockReset();
  sendMail.mockResolvedValue({ messageId: 'test' });
});

// A fresh app per test: every limiter has its own in-memory counter
const limited = (options = {}) => createApp({ rateLimits: { enabled: true }, ...options });

const RESEND_MESSAGE = 'Demasiados reenvíos de verificación; intente de nuevo en una hora';
const FORGOT_IP_MESSAGE = 'Demasiadas solicitudes de recuperación desde esta IP; intente de nuevo en una hora';
const FORGOT_EMAIL_MESSAGE = 'Demasiadas solicitudes de recuperación para este correo; intente de nuevo en una hora';
const TOKEN_MESSAGE = 'Demasiados intentos; intente de nuevo en 15 minutos';
const limitedBody = (message) => ({ success: false, error: { code: 'RATE_LIMITED', message } });

const resend = (app, token) => request(app).post('/api/auth/resend-verification').set('Authorization', `Bearer ${token}`).send({});
const forgot = (app, email, ip) => {
  const req = request(app).post('/api/auth/forgot-password');
  if (ip) req.set('X-Forwarded-For', ip);
  return req.send({ email });
};

describe('resend-verification', () => {
  it('3 per hour per user, then 429; other users are not affected and a limited request sends nothing', async () => {
    const app = limited();
    const { token } = await createUser({ emailVerified: false });
    const other = await createUser({ emailVerified: false });

    for (let i = 0; i < 3; i++) expect((await resend(app, token)).status).toBe(200);
    expect(sendMail).toHaveBeenCalledTimes(3);

    const res = await resend(app, token);
    expect(res.status).toBe(429);
    expect(res.body).toEqual(limitedBody(RESEND_MESSAGE));
    expect(res.headers['ratelimit-policy']).toBe('3;w=3600');
    expect(sendMail).toHaveBeenCalledTimes(3);

    expect((await resend(app, other.token)).status).toBe(200);
  });

  it('is counted per user, not per IP', async () => {
    const app = limited();
    const users = await Promise.all([1, 2, 3, 4].map(() => createUser({ emailVerified: false })));
    for (const { token } of users) expect((await resend(app, token)).status).toBe(200);
  });
});

describe('forgot-password', () => {
  it('5 per hour per IP, then 429 (unknown emails count too)', async () => {
    const app = limited();
    for (let i = 0; i < 5; i++) expect((await forgot(app, `nadie-${i}@test.local`)).status).toBe(200);

    const res = await forgot(app, 'otro@test.local');
    expect(res.status).toBe(429);
    expect(res.body).toEqual(limitedBody(FORGOT_IP_MESSAGE));
    expect(res.headers['ratelimit-policy']).toBe('5;w=3600');
  });

  it('5 per hour per email even from different IPs; other emails are not affected', async () => {
    const app = limited({ trustProxy: 1 });
    const { user } = await createUser();
    for (let i = 0; i < 5; i++) expect((await forgot(app, user.email, `10.5.0.${i}`)).status).toBe(200);
    expect(sendMail).toHaveBeenCalledTimes(5);

    const res = await forgot(app, user.email.toUpperCase(), '10.5.0.99');
    expect(res.status).toBe(429);
    expect(res.body).toEqual(limitedBody(FORGOT_EMAIL_MESSAGE));
    expect(sendMail).toHaveBeenCalledTimes(5);

    expect((await forgot(app, 'otra@test.local', '10.5.0.99')).status).toBe(200);
  });

  it('is limited the same for an unknown email as for a known one', async () => {
    const app = limited({ trustProxy: 1 });
    for (let i = 0; i < 5; i++) expect((await forgot(app, 'fantasma@test.local', `10.6.0.${i}`)).status).toBe(200);
    const res = await forgot(app, 'fantasma@test.local', '10.6.0.99');
    expect(res.status).toBe(429);
    expect(res.body).toEqual(limitedBody(FORGOT_EMAIL_MESSAGE));
  });
});

describe('verify-email and reset-password', () => {
  it('verify-email: 10 attempts per IP per 15 minutes, then 429', async () => {
    const app = limited();
    const attempt = () => request(app).post('/api/auth/verify-email').send({ token: 'no-es-un-token' });
    for (let i = 0; i < 10; i++) expect((await attempt()).status).toBe(400);

    const res = await attempt();
    expect(res.status).toBe(429);
    expect(res.body).toEqual(limitedBody(TOKEN_MESSAGE));
  });

  it('reset-password: 10 attempts per IP per 15 minutes, then 429; counted apart from verify-email', async () => {
    const app = limited();
    const attempt = () => request(app).post('/api/auth/reset-password').send({ token: 'no-es-un-token', password: 'password123' });
    for (let i = 0; i < 10; i++) expect((await attempt()).status).toBe(400);

    const res = await attempt();
    expect(res.status).toBe(429);
    expect(res.body).toEqual(limitedBody(TOKEN_MESSAGE));

    expect((await request(app).post('/api/auth/verify-email').send({ token: 'x' })).status).toBe(400);
  });

  it('existing login limit is unchanged by the new limiters', async () => {
    const app = limited();
    const attempt = (i) => request(app).post('/api/auth/login').send({ email: `nadie-${i}@test.local`, password: 'wrong-password' });
    for (let i = 0; i < 10; i++) expect((await attempt(i)).status).toBe(401);
    const res = await attempt(99);
    expect(res.status).toBe(429);
    expect(res.body.error.message).toBe(
      'Demasiados intentos de autenticación desde esta IP; intente de nuevo en 15 minutos'
    );
  });
});
