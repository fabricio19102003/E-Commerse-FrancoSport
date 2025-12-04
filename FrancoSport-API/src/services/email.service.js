import { transporter } from '../config/email.js';
import * as templates from '../utils/emailTemplates.js';
import prisma from '../utils/prisma.js';

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

export const sendPromotionEmail = async (user, promotion) => {
  const subject = `¡Nueva Oferta: ${promotion.title}! - Franco Sport`;
  const html = templates.promotionTemplate(promotion);
  return sendEmail(user.email, subject, html);
};

export const broadcastPromotion = async (promotion) => {
  // Get all users who have verified their email and are active
  const users = await prisma.user.findMany({
    where: {
      email_verified: true,
      is_active: true,
      role: 'CUSTOMER',
    },
    select: {
      email: true,
      first_name: true,
    },
  });

  console.log(`📧 Starting broadcast of promotion "${promotion.title}" to ${users.length} users...`);

  let sentCount = 0;
  const errors = [];

  for (const user of users) {
    try {
      await sendPromotionEmail(user, promotion);
      sentCount++;
    } catch (error) {
      console.error(`Failed to send promotion to ${user.email}:`, error);
      errors.push({ email: user.email, error: error.message });
    }
  }

  console.log(`✅ Broadcast complete. Sent: ${sentCount}, Failed: ${errors.length}`);
  return { sentCount, errors };
};

export const sendMarketingEmail = async (user, data) => {
  const { subject, title, message, imageUrl, link, linkText } = data;
  const html = templates.marketingTemplate(title, message, imageUrl, link, linkText);
  return sendEmail(user.email, subject, html);
};

export const broadcastMarketingEmail = async (data) => {
  // Get all users who have verified their email and are active
  // Also include users who subscribed to newsletter if you have that field (assuming all active customers for now)
  const users = await prisma.user.findMany({
    where: {
      email_verified: true,
      is_active: true,
      role: 'CUSTOMER', // Or any role you want to target
    },
    select: {
      email: true,
      first_name: true,
    },
  });

  console.log(`📧 Starting broadcast of marketing email "${data.subject}" to ${users.length} users...`);

  let sentCount = 0;
  const errors = [];

  // Send in chunks or sequentially to avoid overwhelming the mail server
  for (const user of users) {
    try {
      await sendMarketingEmail(user, data);
      sentCount++;
    } catch (error) {
      console.error(`Failed to send marketing email to ${user.email}:`, error);
      errors.push({ email: user.email, error: error.message });
    }
  }

  console.log(`✅ Marketing broadcast complete. Sent: ${sentCount}, Failed: ${errors.length}`);
  return { sentCount, errors };
};
