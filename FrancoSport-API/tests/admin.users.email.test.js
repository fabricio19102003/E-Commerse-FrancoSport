import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';

const { sendMail } = vi.hoisted(() => ({ sendMail: vi.fn() }));
vi.mock('../src/config/email.js', () => ({ transporter: { sendMail } }));

import { app, api, prisma, createUser, sha256, linkToken } from './helpers.js';

const FRONTEND = 'https://tienda.test';
let counter = 0;
const newEmail = () => `nuevo-${Date.now().toString(36)}${counter++}@test.local`;

beforeEach(() => {
  sendMail.mockReset();
  sendMail.mockResolvedValue({ messageId: 'test' });
  vi.stubEnv('FRONTEND_URL', FRONTEND);
});
afterEach(() => vi.unstubAllEnvs());

const update = (admin, id, body) => request(app).put(`/api/admin/users/${id}`).set('Authorization', `Bearer ${admin.token}`).send(body);
const mailsTo = (email) => sendMail.mock.calls.map(([m]) => m).filter((m) => m.to === email);
const stored = (id) => prisma.user.findUnique({ where: { id } });

describe('PUT /api/admin/users/:id changing the email (S3)', () => {
  it('unverifies the account and sends a verification link to the new address only', async () => {
    const admin = await createUser({ role: 'ADMIN' });
    const { user } = await createUser({ emailVerified: true });
    const email = newEmail();
    sendMail.mockClear();

    const res = await update(admin, user.id, { email, first_name: 'Nuevo' });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ email, first_name: 'Nuevo', email_verified: false });
    expect((await stored(user.id)).email_verified).toBe(false);

    await vi.waitFor(() => expect(mailsTo(email)).toHaveLength(1));
    expect(mailsTo(user.email)).toHaveLength(0);
    const mail = mailsTo(email)[0];
    expect(mail.subject).toBe('Verifica tu correo electrónico - Franco Sport');
    const { link, token } = linkToken(mail.html, '/verificar-correo');
    expect(link).toBe(`${FRONTEND}/verificar-correo?token=${token}`);
    expect(await prisma.userToken.findUnique({ where: { token_hash: sha256(token) } })).toMatchObject({
      user_id: user.id,
      type: 'VERIFY_EMAIL',
      used_at: null,
    });

    // The link verifies the new address
    expect((await api.post('/api/auth/verify-email', null, { token })).status).toBe(200);
    expect((await stored(user.id)).email_verified).toBe(true);
  });

  it('an email change wins over email_verified: true in the same request', async () => {
    const admin = await createUser({ role: 'ADMIN' });
    const { user } = await createUser({ emailVerified: true });

    const res = await update(admin, user.id, { email: newEmail(), email_verified: true });

    expect(res.status).toBe(200);
    expect(res.body.data.email_verified).toBe(false);
  });

  it('revokes the verification links sent to the old address', async () => {
    const admin = await createUser({ role: 'ADMIN' });
    const { user } = await createUser({ emailVerified: false });
    const oldToken = 'old-verification-token-0123456789abcdefghijklmn';
    await prisma.userToken.create({
      data: { user_id: user.id, type: 'VERIFY_EMAIL', token_hash: sha256(oldToken), expires_at: new Date(Date.now() + 3600e3) },
    });

    expect((await update(admin, user.id, { email: newEmail() })).status).toBe(200);

    expect((await api.post('/api/auth/verify-email', null, { token: oldToken })).status).toBe(400);
    expect((await stored(user.id)).email_verified).toBe(false);
  });

  it('keeps the flag and sends nothing when the email is unchanged or absent', async () => {
    const admin = await createUser({ role: 'ADMIN' });
    const { user } = await createUser({ emailVerified: true });
    sendMail.mockClear();

    const same = await update(admin, user.id, { email: user.email, first_name: 'Igual' });
    const other = await update(admin, user.id, { phone: '71111111' });

    expect(same.status).toBe(200);
    expect(other.status).toBe(200);
    expect((await stored(user.id)).email_verified).toBe(true);
    expect(await prisma.userToken.count({ where: { user_id: user.id } })).toBe(0);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('an email already in use changes nothing and sends nothing', async () => {
    const admin = await createUser({ role: 'ADMIN' });
    const { user } = await createUser({ emailVerified: true });
    const taken = await createUser();
    sendMail.mockClear();

    const res = await update(admin, user.id, { email: taken.user.email });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('EMAIL_TAKEN');
    expect(await stored(user.id)).toMatchObject({ email: user.email, email_verified: true });
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('the admin can still set email_verified without changing the email', async () => {
    const admin = await createUser({ role: 'ADMIN' });
    const { user } = await createUser({ emailVerified: false });

    const res = await update(admin, user.id, { email_verified: true });

    expect(res.status).toBe(200);
    expect((await stored(user.id)).email_verified).toBe(true);
  });
});
