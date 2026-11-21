import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app, api, prisma, createUser } from './helpers.js';

const OLD = 'old-password-1';
const NEW = 'new-password-2';

const change = (token, body) => request(app).put('/api/users/password').set('Authorization', `Bearer ${token}`).send(body);
const login = (email, password) => api.post('/api/auth/login', null, { email, password });
const refresh = (refreshToken) => api.post('/api/auth/refresh', null, { refreshToken });

describe('PUT /api/users/password (S4)', () => {
  it('changes the password, sets password_changed_at and stops refresh tokens issued before', async () => {
    const { user, token } = await createUser({ password: OLD });
    const session = await login(user.email, OLD);
    expect(session.status).toBe(200);
    expect((await refresh(session.body.data.refreshToken)).status).toBe(200);

    const before = Date.now();
    const res = await change(token, { current_password: OLD, new_password: NEW });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, message: 'Contraseña actualizada exitosamente' });

    const stored = await prisma.user.findUnique({ where: { id: user.id } });
    expect(stored.password_changed_at.getTime()).toBeGreaterThanOrEqual(before - 1000);

    const old = await refresh(session.body.data.refreshToken);
    expect(old.status).toBe(401);
    expect(old.body).toEqual({
      success: false,
      error: { code: 'INVALID_REFRESH_TOKEN', message: 'Sesión expirada, por favor inicie sesión nuevamente' },
    });

    expect((await login(user.email, OLD)).status).toBe(401);
    const fresh = await login(user.email, NEW);
    expect(fresh.status).toBe(200);
    expect((await refresh(fresh.body.data.refreshToken)).status).toBe(200);
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
