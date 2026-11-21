import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Only the email transport is mocked: templates, links and the service run for real
const { sendMail } = vi.hoisted(() => ({ sendMail: vi.fn() }));
vi.mock('../src/config/email.js', () => ({ transporter: { sendMail } }));

import { api, prisma, createUser, sha256, linkToken } from './helpers.js';

const FRONTEND = 'https://tienda.test';
const OLD = 'old-password-1';
const NEW = 'new-password-2';
const REQUESTED = {
  success: true,
  message: 'Si el correo está registrado, recibirá instrucciones para restablecer su contraseña',
};
const INVALID = {
  success: false,
  error: { code: 'INVALID_TOKEN', message: 'El enlace para restablecer la contraseña no es válido o ha expirado' },
};

beforeEach(() => {
  sendMail.mockReset();
  sendMail.mockResolvedValue({ messageId: 'test' });
  vi.stubEnv('FRONTEND_URL', FRONTEND);
});
afterEach(() => vi.unstubAllEnvs());

const mailsTo = (email) => sendMail.mock.calls.map(([m]) => m).filter((m) => m.to === email);
const resetMail = (email) => mailsTo(email).find((m) => linkToken(m.html, '/restablecer-contrasena'));
const rowFor = (token) => prisma.userToken.findUnique({ where: { token_hash: sha256(token) } });
const forgot = (email) => api.post('/api/auth/forgot-password', null, { email });
const login = (email, password) => api.post('/api/auth/login', null, { email, password });
const reset = (token, password) => api.post('/api/auth/reset-password', null, { token, password });

const requestReset = async (user) => {
  sendMail.mockClear();
  expect((await forgot(user.email)).status).toBe(200);
  return linkToken(resetMail(user.email).html, '/restablecer-contrasena');
};

describe('POST /api/auth/forgot-password', () => {
  it('sends the reset link to a known email; only the hash is stored (60 min)', async () => {
    const { user } = await createUser({ password: OLD });
    sendMail.mockClear();

    const res = await forgot(user.email);
    expect(res.status).toBe(200);
    expect(res.body).toEqual(REQUESTED);

    expect(mailsTo(user.email)).toHaveLength(1);
    const mail = resetMail(user.email);
    expect(mail.subject).toBe('Recuperación de contraseña - Franco Sport');
    const { link, token } = linkToken(mail.html, '/restablecer-contrasena');
    expect(link).toBe(`${FRONTEND}/restablecer-contrasena?token=${token}`);
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);

    const row = await rowFor(token);
    expect(row).toMatchObject({ user_id: user.id, type: 'RESET_PASSWORD', used_at: null });
    const ttl = row.expires_at.getTime() - Date.now();
    expect(ttl).toBeGreaterThan(3600e3 - 60e3);
    expect(ttl).toBeLessThanOrEqual(3600e3);
  });

  it('answers an unknown email exactly like a known one, sending and storing nothing', async () => {
    const { user } = await createUser();
    const known = await forgot(user.email);
    sendMail.mockClear();
    const tokensBefore = await prisma.userToken.count();

    const unknown = await forgot('nadie-existe@test.local');
    expect(unknown.status).toBe(known.status);
    expect(unknown.body).toEqual(known.body);
    expect(unknown.body).toEqual(REQUESTED);
    expect(sendMail).not.toHaveBeenCalled();
    expect(await prisma.userToken.count()).toBe(tokensBefore);
  });

  it('answers the same for a deactivated account and sends nothing', async () => {
    const { user } = await createUser({ isActive: false });
    sendMail.mockClear();

    const res = await forgot(user.email);
    expect(res.status).toBe(200);
    expect(res.body).toEqual(REQUESTED);
    expect(sendMail).not.toHaveBeenCalled();
    expect(await prisma.userToken.count({ where: { user_id: user.id } })).toBe(0);
  });

  it('rejects a malformed email', async () => {
    const res = await forgot('no-es-un-correo');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toEqual([{ field: 'email', message: 'Email inválido' }]);
    expect(sendMail).not.toHaveBeenCalled();
  });
});

describe('POST /api/auth/reset-password', () => {
  it('sets the new password, consumes the token and does not log in', async () => {
    const { user } = await createUser({ password: OLD });
    const { token } = await requestReset(user);

    const res = await reset(token, NEW);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      message: 'Contraseña actualizada correctamente. Inicie sesión con su nueva contraseña',
    });
    expect(res.body.data).toBeUndefined();

    expect((await login(user.email, NEW)).status).toBe(200);
    expect((await login(user.email, OLD)).status).toBe(401);
    expect((await rowFor(token)).used_at).toBeInstanceOf(Date);
  });

  it('is single use: reusing the token fails and keeps the new password', async () => {
    const { user } = await createUser({ password: OLD });
    const { token } = await requestReset(user);
    expect((await reset(token, NEW)).status).toBe(200);

    const res = await reset(token, 'third-password-3');
    expect(res.status).toBe(400);
    expect(res.body).toEqual(INVALID);
    expect((await login(user.email, NEW)).status).toBe(200);
    expect((await login(user.email, 'third-password-3')).status).toBe(401);
  });

  it('rejects a wrong token and changes nothing', async () => {
    const { user } = await createUser({ password: OLD });
    const { token } = await requestReset(user);

    const res = await reset(`${token.slice(0, -1)}${token.endsWith('A') ? 'B' : 'A'}`, NEW);
    expect(res.status).toBe(400);
    expect(res.body).toEqual(INVALID);
    expect((await login(user.email, OLD)).status).toBe(200);
    expect((await rowFor(token)).used_at).toBeNull();
  });

  it('rejects an expired token and changes nothing', async () => {
    const { user } = await createUser({ password: OLD });
    const { token } = await requestReset(user);
    await prisma.userToken.update({ where: { token_hash: sha256(token) }, data: { expires_at: new Date(Date.now() - 1000) } });

    const res = await reset(token, NEW);
    expect(res.status).toBe(400);
    expect(res.body).toEqual(INVALID);
    expect((await login(user.email, OLD)).status).toBe(200);
    expect((await login(user.email, NEW)).status).toBe(401);
    expect((await rowFor(token)).used_at).toBeNull();
  });

  it('applies the registration password rules and leaves the token usable', async () => {
    const { user } = await createUser({ password: OLD });
    const { token } = await requestReset(user);

    const res = await reset(token, 'corta');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toEqual([
      { field: 'password', message: 'La contraseña debe tener al menos 8 caracteres' },
    ]);
    expect((await login(user.email, OLD)).status).toBe(200);
    expect((await rowFor(token)).used_at).toBeNull();

    expect((await reset(token, NEW)).status).toBe(200);
  });

  it('requires token and password', async () => {
    const res = await api.post('/api/auth/reset-password', null, {});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.map((d) => d.field).sort()).toEqual(['password', 'token']);
  });

  it('rejects an email-verification token', async () => {
    const { user } = await createUser({ password: OLD });
    const raw = 'verify-token-for-reset-test-0123456789abcdefghi';
    await prisma.userToken.create({
      data: { user_id: user.id, type: 'VERIFY_EMAIL', token_hash: sha256(raw), expires_at: new Date(Date.now() + 3600e3) },
    });

    const res = await reset(raw, NEW);
    expect(res.status).toBe(400);
    expect(res.body).toEqual(INVALID);
    expect((await login(user.email, OLD)).status).toBe(200);
  });

  it("invalidates the user's other reset tokens but not other users'", async () => {
    const { user } = await createUser({ password: OLD });
    const other = await createUser({ password: OLD });
    const { token: first } = await requestReset(user);
    const { token: second } = await requestReset(user);
    const { token: othersToken } = await requestReset(other.user);

    expect((await reset(first, NEW)).status).toBe(200);

    expect((await reset(second, 'another-password-4')).body).toEqual(INVALID);
    expect((await rowFor(second)).used_at).toBeInstanceOf(Date);
    expect((await rowFor(othersToken)).used_at).toBeNull();
    expect((await login(user.email, NEW)).status).toBe(200);
  });

  it('does not touch the email-verification state', async () => {
    const { user } = await createUser({ password: OLD, emailVerified: false });
    const { token } = await requestReset(user);
    expect((await reset(token, NEW)).status).toBe(200);
    expect((await prisma.user.findUnique({ where: { id: user.id } })).email_verified).toBe(false);
  });
});

describe('refresh sessions', () => {
  const refresh = (refreshToken) => api.post('/api/auth/refresh', null, { refreshToken });

  it('before any reset, an existing refresh token keeps working (unchanged behavior)', async () => {
    const { user } = await createUser({ password: OLD });
    const session = await login(user.email, OLD);
    expect(session.status).toBe(200);
    expect(session.body.data.user.password_changed_at).toBeUndefined();

    const res = await refresh(session.body.data.refreshToken);
    expect(res.status).toBe(200);
    expect(typeof res.body.data.token).toBe('string');
  });

  it('a reset stops refresh tokens issued before it, including in the same second', async () => {
    const { user } = await createUser({ password: OLD });
    const session = await login(user.email, OLD);
    const { token } = await requestReset(user);
    expect((await reset(token, NEW)).status).toBe(200);

    const res = await refresh(session.body.data.refreshToken);
    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      success: false,
      error: { code: 'INVALID_REFRESH_TOKEN', message: 'Sesión expirada, por favor inicie sesión nuevamente' },
    });
  });

  it('a refresh token from a login after the reset works', async () => {
    const { user } = await createUser({ password: OLD });
    const { token } = await requestReset(user);
    expect((await reset(token, NEW)).status).toBe(200);

    const session = await login(user.email, NEW);
    expect((await refresh(session.body.data.refreshToken)).status).toBe(200);
  });

  it("a reset does not affect other users' refresh tokens", async () => {
    const { user } = await createUser({ password: OLD });
    const other = await createUser({ password: OLD });
    const otherSession = await login(other.user.email, OLD);
    const { token } = await requestReset(user);
    expect((await reset(token, NEW)).status).toBe(200);

    expect((await refresh(otherSession.body.data.refreshToken)).status).toBe(200);
  });
});
