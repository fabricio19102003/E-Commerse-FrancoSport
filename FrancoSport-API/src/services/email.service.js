import { transporter } from '../config/email.js';
import * as templates from '../utils/emailTemplates.js';

export const sendEmail = async (to, subject, html) => {
  if (!transporter) {
    console.log(`[MOCK EMAIL] To: ${to}, Subject: ${subject}`);
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: `"${process.env.APP_NAME || 'Franco Sport'}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log('Message sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    // Don't throw error to prevent blocking the main flow
    return null;
  }
};

export const sendWelcomeEmail = async (user) => {
  const subject = '¡Bienvenido a Franco Sport!';
  const html = templates.welcomeTemplate(user.first_name);
  return sendEmail(user.email, subject, html);
};

export const sendVerificationEmail = async (user, token) => {
  const link = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  const subject = 'Verifica tu correo electrónico - Franco Sport';
  const html = templates.verificationTemplate(user.first_name, link);
  return sendEmail(user.email, subject, html);
};

export const sendPasswordResetEmail = async (user, token) => {
  const link = `${process.env.FRONTEND_URL}/restablecer-contrasena/${token}`;
  const subject = 'Recuperación de contraseña - Franco Sport';
  const html = templates.passwordResetTemplate(user.first_name, link);
  return sendEmail(user.email, subject, html);
};

export const sendOrderConfirmationEmail = async (order) => {
  const subject = `Confirmación de Pedido #${order.order_number} - Franco Sport`;
  const html = templates.orderConfirmationTemplate(order);
  return sendEmail(order.user.email, subject, html);
};

export const sendOrderStatusEmail = async (order, status) => {
  const subject = `Actualización de Pedido #${order.order_number} - Franco Sport`;
  const html = templates.orderStatusTemplate(order, status);
  return sendEmail(order.user.email, subject, html);
};
