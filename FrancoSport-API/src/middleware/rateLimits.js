/**
 * Rate limits
 *
 * One factory so the app (and the tests that assert the limits) get fresh
 * in-memory counters. Limiters are skipped when `enabled` is false; the
 * default is off only under NODE_ENV=test, where the suite sends far more
 * requests than a person would from one IP.
 */

import rateLimit from 'express-rate-limit';

const WINDOW_MS = 15 * 60 * 1000;

export const RATE_LIMITS = {
  global: 600, // per IP
  auth: 10, // login, register and refresh, each per IP
  authEmail: 10, // login and register, each per email
  orders: 20, // order creation, per user
};

const tooMany = (code, message) => (req, res) =>
  res.status(429).json({ success: false, error: { code, message } });

export const createRateLimiters = ({ enabled = process.env.NODE_ENV !== 'test' } = {}) => {
  const make = ({ limit, code = 'RATE_LIMITED', message, keyGenerator, skip }) =>
    rateLimit({
      windowMs: WINDOW_MS,
      limit,
      standardHeaders: true,
      legacyHeaders: false,
      ...(keyGenerator && { keyGenerator }),
      skip: (req) => !enabled || Boolean(skip?.(req)),
      handler: tooMany(code, message),
    });

  const byIp = (message) => make({ limit: RATE_LIMITS.auth, message });
  const byEmail = () =>
    make({
      limit: RATE_LIMITS.authEmail,
      message: 'Demasiados intentos con este correo; intente de nuevo en 15 minutos',
      keyGenerator: (req) => `email-${String(req.body.email).trim().toLowerCase()}`,
      skip: (req) => typeof req.body?.email !== 'string',
    });
  const authMessage = 'Demasiados intentos de autenticación desde esta IP; intente de nuevo en 15 minutos';

  return {
    global: make({
      limit: RATE_LIMITS.global,
      code: 'TOO_MANY_REQUESTS',
      message: 'Demasiadas peticiones desde esta IP, por favor intente de nuevo después de 15 minutos',
    }),
    login: [byIp(authMessage), byEmail()],
    register: [byIp(authMessage), byEmail()],
    refresh: [byIp(authMessage)],
    // After authenticate: counted per account
    orderCreate: make({
      limit: RATE_LIMITS.orders,
      message: 'Demasiados pedidos en poco tiempo; intente de nuevo en 15 minutos',
      keyGenerator: (req) => `user-${req.user.id}`,
    }),
  };
};
