/**
 * Single-use email tokens (email verification and password reset)
 * Franco Sport E-Commerce
 *
 * The raw token only ever travels in the email link; the database keeps its
 * SHA-256, an expiry and used_at, so a leaked table cannot be replayed.
 */

import { randomBytes, createHash } from 'node:crypto';
import prisma from '../utils/prisma.js';

export const TOKEN_TYPES = {
  VERIFY_EMAIL: 'VERIFY_EMAIL',
  RESET_PASSWORD: 'RESET_PASSWORD',
};

export const TOKEN_TTL_MS = {
  VERIFY_EMAIL: 24 * 60 * 60 * 1000,
  RESET_PASSWORD: 60 * 60 * 1000,
};

export const hashToken = (token) => createHash('sha256').update(token).digest('hex');

const generateRawToken = () => randomBytes(32).toString('base64url');

/**
 * Invalidate every unused token of a type for a user
 */
export const revokeTokens = (userId, type, db = prisma) =>
  db.userToken.updateMany({
    where: { user_id: userId, type, used_at: null },
    data: { used_at: new Date() },
  });

/**
 * Create a token and return the raw value (to put in the link).
 * `revokePrevious` invalidates the user's other unused tokens of the same type.
 */
export const issueToken = async (userId, type, { revokePrevious = false } = {}) => {
  const token = generateRawToken();
  const create = (db) =>
    db.userToken.create({
      data: {
        user_id: userId,
        type,
        token_hash: hashToken(token),
        expires_at: new Date(Date.now() + TOKEN_TTL_MS[type]),
      },
    });

  if (revokePrevious) {
    await prisma.$transaction(async (tx) => {
      await revokeTokens(userId, type, tx);
      await create(tx);
    });
  } else {
    await create(prisma);
  }
  return token;
};

/**
 * Atomically use a token: succeeds once, only while unexpired and of the given type.
 * Returns the user id, or null when the token is unknown, wrong type, used or expired.
 * Pass a transaction client to make the use roll back with the caller's other writes.
 */
export const consumeToken = async (rawToken, type, db = prisma) => {
  if (typeof rawToken !== 'string' || !rawToken) return null;
  const token_hash = hashToken(rawToken);
  const now = new Date();

  const { count } = await db.userToken.updateMany({
    where: { token_hash, type, used_at: null, expires_at: { gt: now } },
    data: { used_at: now },
  });
  if (count !== 1) return null;

  const row = await db.userToken.findUnique({ where: { token_hash }, select: { user_id: true } });
  return row.user_id;
};
