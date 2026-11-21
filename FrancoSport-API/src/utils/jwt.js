/**
 * JWT Utilities
 * Franco Sport E-Commerce
 */

import jwt from 'jsonwebtoken';

/**
 * Generate JWT token (Access Token)
 * @param {Object} payload - Data to encode in token
 * @returns {String} JWT token
 */
export const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });
};

/**
 * Generate Refresh Token
 * @param {Object} payload - Data to encode in token
 * @returns {String} JWT token
 */
export const generateRefreshToken = (payload) => {
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET is required. Refresh tokens must use a separate secret from access tokens.');
  }
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
};

/**
 * Verify JWT token
 * @param {String} token - JWT token to verify
 * @returns {Object} Decoded payload
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Token inválido o expirado');
  }
};

/**
 * Verify Refresh Token
 * @param {String} token - Refresh token to verify
 * @returns {Object} Decoded payload
 */
export const verifyRefreshToken = (token) => {
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET is required. Refresh tokens must use a separate secret from access tokens.');
  }
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    throw new Error('Refresh token inválido o expirado');
  }
};

/**
 * The user's password state as a number: password_changed_at in ms, 0 if never changed.
 * Access and refresh tokens carry it as `pwd`.
 */
const passwordState = (user) => (user.password_changed_at ? user.password_changed_at.getTime() : 0);

/**
 * Payload of an access token. A reset or password change moves `pwd`, so access tokens
 * issued before it no longer match (see `authenticate`).
 * @param {Object} user - User with id, email, role and password_changed_at
 */
export const accessTokenPayload = (user) => ({
  id: user.id,
  email: user.email,
  role: user.role,
  pwd: passwordState(user),
});

/**
 * Whether a decoded access token was issued for the user's current password.
 * Tokens without the claim count as 0, matching users who never changed their password.
 */
export const isAccessTokenCurrent = (decoded, user) => (decoded.pwd ?? 0) === passwordState(user);

/**
 * Payload of a refresh token. `pwd` is the user's password_changed_at (ms, 0 if never):
 * a password reset changes it, so refresh tokens issued before the reset no longer match.
 * @param {Object} user - User with id and password_changed_at
 */
export const refreshTokenPayload = (user) => ({
  id: user.id,
  pwd: passwordState(user),
});

/**
 * Whether a decoded refresh token was issued for the user's current password.
 * Tokens issued before this claim existed have none and count as 0, matching users who never reset.
 */
export const isRefreshTokenCurrent = (decoded, user) => (decoded.pwd ?? 0) === passwordState(user);
