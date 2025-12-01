/**
 * Notification Controller
 * Franco Sport API
 */

import webpush from 'web-push';
import prisma from '../utils/prisma.js';

// Configure web-push
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:${process.env.EMAIL_USER || 'admin@francosport.com'}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
} else {
  console.warn('⚠️ VAPID Keys missing. Push notifications will not work.');
  // Generate keys for development convenience (log them)
  const vapidKeys = webpush.generateVAPIDKeys();
  console.log('🔑 Generated VAPID Keys (Add to .env):');
  console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
  console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
}

/**
 * Subscribe to push notifications
 * POST /api/notifications/subscribe
 */
export const subscribe = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const subscription = req.body;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_SUBSCRIPTION',
          message: 'Datos de suscripción inválidos',
        },
      });
    }

    // Save subscription to DB
    await prisma.pushSubscription.create({
      data: {
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Suscripción exitosa',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get VAPID Public Key
 * GET /api/notifications/vapid-key
 */
export const getVapidKey = (req, res) => {
  res.json({
    success: true,
    publicKey: process.env.VAPID_PUBLIC_KEY,
  });
};

/**
 * Send notification to a user (Internal Helper)
 */
export const sendNotificationToUser = async (userId, payload) => {
  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { user_id: userId },
    });

    if (subscriptions.length === 0) return;

    const notifications = subscriptions.map((sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      return webpush.sendNotification(pushSubscription, JSON.stringify(payload))
        .catch(async (err) => {
          if (err.statusCode === 410 || err.statusCode === 404) {
            // Subscription is invalid/expired, remove it
            await prisma.pushSubscription.delete({ where: { id: sub.id } });
          }
          console.error('Error sending push notification:', err);
        });
    });

    await Promise.all(notifications);
  } catch (error) {
    console.error('Error sending notifications to user:', error);
  }
};
