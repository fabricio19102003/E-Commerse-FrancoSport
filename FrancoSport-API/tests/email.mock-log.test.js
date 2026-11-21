import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// No SMTP: the transport is absent whatever the machine's environment says
vi.mock('../src/config/email.js', () => ({ transporter: null }));

const { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } = await import(
  '../src/services/email.service.js'
);

const user = { email: 'ana@example.com', first_name: 'Ana' };
const VERIFY_SUBJECT = 'Verifica tu correo electrónico - Franco Sport';
const RESET_SUBJECT = 'Recuperación de contraseña - Franco Sport';

describe('emails without SMTP (S6): [MOCK EMAIL] log', () => {
  let log;
  const original = { NODE_ENV: process.env.NODE_ENV, FRONTEND_URL: process.env.FRONTEND_URL };

  beforeEach(() => {
    log = vi.spyOn(console, 'log').mockImplementation(() => {});
    process.env.FRONTEND_URL = 'https://tienda.test';
  });

  afterEach(() => {
    log.mockRestore();
    process.env.NODE_ENV = original.NODE_ENV;
    if (original.FRONTEND_URL === undefined) delete process.env.FRONTEND_URL;
    else process.env.FRONTEND_URL = original.FRONTEND_URL;
  });

  const logged = () => log.mock.calls.map((args) => args.join(' '));

  it('outside production logs recipient, subject and the verification link', async () => {
    process.env.NODE_ENV = 'development';
    await sendVerificationEmail(user, 'tok123');

    expect(logged()).toEqual([
      `[MOCK EMAIL] To: ana@example.com, Subject: ${VERIFY_SUBJECT}, Links: https://tienda.test/verificar-correo?token=tok123`,
    ]);
  });

  it('outside production logs the password reset link', async () => {
    process.env.NODE_ENV = 'test';
    await sendPasswordResetEmail(user, 'tok456');

    expect(logged()).toEqual([
      `[MOCK EMAIL] To: ana@example.com, Subject: ${RESET_SUBJECT}, Links: https://tienda.test/restablecer-contrasena?token=tok456`,
    ]);
  });

  it('in production logs only recipient and subject, never a link or token', async () => {
    process.env.NODE_ENV = 'production';
    await sendVerificationEmail(user, 'tok123');
    await sendPasswordResetEmail(user, 'tok456');

    expect(logged()).toEqual([
      `[MOCK EMAIL] To: ana@example.com, Subject: ${VERIFY_SUBJECT}`,
      `[MOCK EMAIL] To: ana@example.com, Subject: ${RESET_SUBJECT}`,
    ]);
    expect(logged().join('\n')).not.toMatch(/token|http/i);
  });

  it('an email without links keeps the previous line outside production', async () => {
    process.env.NODE_ENV = 'development';
    await sendWelcomeEmail(user);

    const [line] = logged();
    expect(line.startsWith('[MOCK EMAIL] To: ana@example.com, Subject: ¡Bienvenido a Franco Sport!')).toBe(true);
    expect(line).not.toMatch(/token=/);
  });
});
