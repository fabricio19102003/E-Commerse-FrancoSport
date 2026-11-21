import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { authenticate, requireVerifiedEmail } from '../src/middleware/auth.js';
import { createUser, prisma } from './helpers.js';

// The middleware behind a throwaway route, exactly as the order route chains it
const app = express();
app.post('/probe', authenticate, requireVerifiedEmail, (req, res) => res.status(201).json({ success: true, reached: true }));

const probe = (token) => request(app).post('/probe').set('Authorization', `Bearer ${token}`).send({});

describe('requireVerifiedEmail', () => {
  it('rejects an unverified customer with 403 EMAIL_NOT_VERIFIED and never reaches the handler', async () => {
    const { token } = await createUser({ emailVerified: false });
    const res = await probe(token);
    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      success: false,
      error: {
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Debe verificar su correo electrónico antes de realizar un pedido',
      },
    });
  });

  it('lets a verified customer through', async () => {
    const { token } = await createUser({ emailVerified: true });
    const res = await probe(token);
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ success: true, reached: true });
  });

  it('lets an unverified admin through', async () => {
    const { token } = await createUser({ role: 'ADMIN', emailVerified: false });
    expect((await probe(token)).status).toBe(201);
  });

  it('does not exempt an unverified moderator', async () => {
    const { token } = await createUser({ role: 'MODERATOR', emailVerified: false });
    expect((await probe(token)).status).toBe(403);
  });

  it('still answers 401 without a token (authenticate runs first)', async () => {
    const res = await request(app).post('/probe').send({});
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('reads the current flag: verifying the email unlocks the same token', async () => {
    const { user, token } = await createUser({ emailVerified: false });
    expect((await probe(token)).status).toBe(403);
    await prisma.user.update({ where: { id: user.id }, data: { email_verified: true } });
    expect((await probe(token)).status).toBe(201);
  });
});
