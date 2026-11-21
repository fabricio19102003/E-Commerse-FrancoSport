import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Only the email transport is mocked: templates, links and the service run for real
const { sendMail } = vi.hoisted(() => ({ sendMail: vi.fn() }));
vi.mock('../src/config/email.js', () => ({ transporter: { sendMail } }));

import { api, prisma, createUser, sha256, linkToken } from './helpers.js';

const FRONTEND = 'https://tienda.test';
const INVALID = {
  success: false,
  error: { code: 'INVALID_TOKEN', message: 'El enlace de verificación no es válido o ha expirado' },
};

beforeEach(() => {
  sendMail.mockReset();
  sendMail.mockResolvedValue({ messageId: 'test' });
  vi.stubEnv('FRONTEND_URL', FRONTEND);
});
afterEach(() => vi.unstubAllEnvs());

const mailsTo = (email) => sendMail.mock.calls.map(([m]) => m).filter((m) => m.to === email);
const verificationMail = (email) => mailsTo(email).find((m) => linkToken(m.html, '/verificar-correo'));
const rowFor = (token) => prisma.userToken.findUnique({ where: { token_hash: sha256(token) } });
const emailVerified = async (id) => (await prisma.user.findUnique({ where: { id } })).email_verified;

const register = async () => {
  const email = `nuevo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.local`;
  const res = await api.post('/api/auth/register', null, {
    email,
    password: 'password123',
    first_name: 'Ana',
    last_name: 'Pérez',
  });
  return { email, res };
};

// An unverified user with a verification token issued through the real resend endpoint
const unverifiedWithToken = async () => {
  const { user, token: jwt } = await createUser({ emailVerified: false });
  sendMail.mockClear();
  const res = await api.post('/api/auth/resend-verification', jwt);
  expect(res.status).toBe(200);
  const { token } = linkToken(verificationMail(user.email).html, '/verificar-correo');
  return { user, jwt, token };
};

describe('registration sends the verification email', () => {
  it('creates an unverified user, sends the link to the new address, stores only the hash (24 h)', async () => {
    const { email, res } = await register();

    expect(res.status).toBe(201);
    expect(res.body.data.user.email_verified).toBe(false);
    expect(res.body.data.user.password_changed_at).toBeUndefined();

    const mail = verificationMail(email);
    expect(mail).toBeDefined();
    expect(mail.subject).toBe('Verifica tu correo electrónico - Franco Sport');
    const { link, token } = linkToken(mail.html, '/verificar-correo');
    expect(link).toBe(`${FRONTEND}/verificar-correo?token=${token}`);
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);

    const row = await rowFor(token);
    expect(row).toMatchObject({ user_id: res.body.data.user.id, type: 'VERIFY_EMAIL', used_at: null });
    expect(row.token_hash).toBe(sha256(token));
    expect(row.token_hash).not.toContain(token);
    const ttl = row.expires_at.getTime() - Date.now();
    expect(ttl).toBeGreaterThan(24 * 3600e3 - 60e3);
    expect(ttl).toBeLessThanOrEqual(24 * 3600e3);
  });

  it('an existing email gets a 400 and no email or token', async () => {
    const { user } = await createUser();
    sendMail.mockClear();
    const res = await api.post('/api/auth/register', null, {
      email: user.email,
      password: 'password123',
      first_name: 'Ana',
      last_name: 'Pérez',
    });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('EMAIL_EXISTS');
    expect(sendMail).not.toHaveBeenCalled();
    expect(await prisma.userToken.count({ where: { user_id: user.id } })).toBe(0);
  });

  it('GET /api/auth/me exposes email_verified', async () => {
    const { email, res } = await register();
    const me = await api.get('/api/auth/me', res.body.data.token);
    expect(me.status).toBe(200);
    expect(me.body.data).toMatchObject({ email, email_verified: false });
    expect(me.body.data.password_changed_at).toBeUndefined();
  });
});

describe('POST /api/auth/verify-email', () => {
  it('marks the email verified, consumes the token and works without being logged in', async () => {
    const { user, jwt, token } = await unverifiedWithToken();

    const res = await api.post('/api/auth/verify-email', null, { token });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, message: 'Correo verificado correctamente' });

    expect(await emailVerified(user.id)).toBe(true);
    expect((await rowFor(token)).used_at).toBeInstanceOf(Date);
    expect((await api.get('/api/auth/me', jwt)).body.data.email_verified).toBe(true);
  });

  it('is single use: the second attempt is rejected', async () => {
    const { user, token } = await unverifiedWithToken();
    expect((await api.post('/api/auth/verify-email', null, { token })).status).toBe(200);
    await prisma.user.update({ where: { id: user.id }, data: { email_verified: false } });

    const res = await api.post('/api/auth/verify-email', null, { token });
    expect(res.status).toBe(400);
    expect(res.body).toEqual(INVALID);
    expect(await emailVerified(user.id)).toBe(false);
  });

  it('rejects a wrong token and changes nothing', async () => {
    const { user, token } = await unverifiedWithToken();

    const res = await api.post('/api/auth/verify-email', null, { token: `${token.slice(0, -1)}${token.endsWith('A') ? 'B' : 'A'}` });
    expect(res.status).toBe(400);
    expect(res.body).toEqual(INVALID);
    expect(await emailVerified(user.id)).toBe(false);
    expect((await rowFor(token)).used_at).toBeNull();
  });

  it('rejects an expired token and changes nothing', async () => {
    const { user, token } = await unverifiedWithToken();
    await prisma.userToken.update({ where: { token_hash: sha256(token) }, data: { expires_at: new Date(Date.now() - 1000) } });

    const res = await api.post('/api/auth/verify-email', null, { token });
    expect(res.status).toBe(400);
    expect(res.body).toEqual(INVALID);
    expect(await emailVerified(user.id)).toBe(false);
    expect((await rowFor(token)).used_at).toBeNull();
  });

  it('rejects a password-reset token', async () => {
    const { user } = await createUser({ emailVerified: false });
    const raw = 'reset-token-for-verify-test-0123456789abcdefghi';
    await prisma.userToken.create({
      data: { user_id: user.id, type: 'RESET_PASSWORD', token_hash: sha256(raw), expires_at: new Date(Date.now() + 3600e3) },
    });

    const res = await api.post('/api/auth/verify-email', null, { token: raw });
    expect(res.status).toBe(400);
    expect(res.body).toEqual(INVALID);
    expect(await emailVerified(user.id)).toBe(false);
  });

  it('requires a token', async () => {
    const res = await api.post('/api/auth/verify-email', null, {});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toEqual([{ field: 'token', message: 'El enlace de verificación no es válido' }]);
  });
});

describe('POST /api/auth/resend-verification', () => {
  it('requires authentication', async () => {
    const res = await api.post('/api/auth/resend-verification', null, {});
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('sends a fresh link to the user and invalidates the previous one', async () => {
    const { user, jwt, token: first } = await unverifiedWithToken();
    sendMail.mockClear();

    const res = await api.post('/api/auth/resend-verification', jwt);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, message: 'Le enviamos un nuevo correo de verificación' });
    expect(mailsTo(user.email)).toHaveLength(1);
    const { link, token: second } = linkToken(verificationMail(user.email).html, '/verificar-correo');
    expect(link).toBe(`${FRONTEND}/verificar-correo?token=${second}`);
    expect(second).not.toBe(first);

    expect((await api.post('/api/auth/verify-email', null, { token: first })).body).toEqual(INVALID);
    expect(await emailVerified(user.id)).toBe(false);
    expect((await api.post('/api/auth/verify-email', null, { token: second })).status).toBe(200);
    expect(await emailVerified(user.id)).toBe(true);
  });

  it('an already verified user gets a 200 and no email or token', async () => {
    const { user, token: jwt } = await createUser({ emailVerified: true });
    sendMail.mockClear();

    const res = await api.post('/api/auth/resend-verification', jwt);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, message: 'Su correo electrónico ya está verificado' });
    expect(sendMail).not.toHaveBeenCalled();
    expect(await prisma.userToken.count({ where: { user_id: user.id } })).toBe(0);
  });
});
