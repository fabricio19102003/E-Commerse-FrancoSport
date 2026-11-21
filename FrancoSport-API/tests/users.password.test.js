import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app, api, prisma, createUser } from './helpers.js';

const OLD = 'old-password-1';
const NEW = 'new-password-2';

const change = (token, body) => request(app).put('/api/users/password').set('Authorization', `Bearer ${token}`).send(body);
const login = (email, password) => api.post('/api/auth/login', null, { email, password });
const profile = (token) => api.get('/api/users/profile', token);
const refresh = (refreshToken) => api.post('/api/auth/refresh', null, { refreshToken });

describe('PUT /api/users/password (S4)', () => {
  it('changes the password, sets password_changed_at and returns a fresh pair; other sessions stop', async () => {
    const { user, token } = await createUser({ password: OLD });
    const session = await login(user.email, OLD);
    const otherDevice = await login(user.email, OLD);
    expect((await refresh(session.body.data.refreshToken)).status).toBe(200);

    const before = Date.now();
    const res = await change(token, { current_password: OLD, new_password: NEW });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Contraseña actualizada exitosamente');
    expect(typeof res.body.data.token).toBe('string');
    expect(typeof res.body.data.refreshToken).toBe('string');

    const stored = await prisma.user.findUnique({ where: { id: user.id } });
    expect(stored.password_changed_at.getTime()).toBeGreaterThanOrEqual(before - 1000);

    // The new refresh token works and returns a working access token
    const renewed = await refresh(res.body.data.refreshToken);
    expect(renewed.status).toBe(200);
    expect((await profile(renewed.body.data.token)).status).toBe(200);
    // The fresh access token works right away
    expect((await profile(res.body.data.token)).status).toBe(200);

    // The old refresh tokens (this one and the other device's) do not
    for (const old of [session, otherDevice]) {
      const rejected = await refresh(old.body.data.refreshToken);
      expect(rejected.status).toBe(401);
      expect(rejected.body).toEqual({
        success: false,
        error: { code: 'INVALID_REFRESH_TOKEN', message: 'Sesión expirada, por favor inicie sesión nuevamente' },
      });
    }

    expect((await login(user.email, OLD)).status).toBe(401);
    expect((await login(user.email, NEW)).status).toBe(200);
  });

  it('access tokens issued before the change stop working (TOKEN_REVOKED)', async () => {
    const { user, token } = await createUser({ password: OLD });
    const session = await login(user.email, OLD);
    expect((await profile(session.body.data.token)).status).toBe(200);

    expect((await change(token, { current_password: OLD, new_password: NEW })).status).toBe(200);

    for (const stale of [token, session.body.data.token]) {
      const res = await profile(stale);
      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        success: false,
        error: { code: 'TOKEN_REVOKED', message: 'Sesión expirada, por favor inicie sesión nuevamente' },
      });
    }
  });

  it('a wrong current password changes nothing and keeps refresh tokens working', async () => {
    const { user, token } = await createUser({ password: OLD });
    const session = await login(user.email, OLD);
    const hash = (await prisma.user.findUnique({ where: { id: user.id } })).password_hash;

    const res = await change(token, { current_password: 'wrong-password', new_password: NEW });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ success: false, error: { code: 'INVALID_PASSWORD', message: 'Contraseña actual incorrecta' } });

    const stored = await prisma.user.findUnique({ where: { id: user.id } });
    expect(stored.password_hash).toBe(hash);
    expect(stored.password_changed_at).toBeNull();
    expect((await refresh(session.body.data.refreshToken)).status).toBe(200);
  });

  it("does not affect other users' refresh tokens", async () => {
    const { user, token } = await createUser({ password: OLD });
    const other = await createUser({ password: OLD });
    const otherSession = await login(other.user.email, OLD);

    expect((await change(token, { current_password: OLD, new_password: NEW })).status).toBe(200);
    expect((await refresh(otherSession.body.data.refreshToken)).status).toBe(200);
    expect((await prisma.user.findUnique({ where: { id: other.user.id } })).password_changed_at).toBeNull();
    expect(user.id).not.toBe(other.user.id);
  });
});
