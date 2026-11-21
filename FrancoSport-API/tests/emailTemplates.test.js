import { describe, it, expect } from 'vitest';
import { verificationTemplate, passwordResetTemplate } from '../src/utils/emailTemplates.js';

describe('token email templates (S3, S4)', () => {
  it('verification says the link expires in 24 hours and keeps the link', () => {
    const html = verificationTemplate('Ana', 'https://tienda.test/verificar-correo?token=abc');
    expect(html).toContain('href="https://tienda.test/verificar-correo?token=abc"');
    expect(html).toContain('Este enlace expirará en 24 horas.');
  });

  it('password reset says the link expires in 60 minutes and keeps the link', () => {
    const html = passwordResetTemplate('Ana', 'https://tienda.test/restablecer-contrasena?token=abc');
    expect(html).toContain('href="https://tienda.test/restablecer-contrasena?token=abc"');
    expect(html).toContain('Este enlace expirará en 60 minutos.');
    expect(html).not.toContain('1 hora');
  });
});
