/**
 * Auth Controller
 * Franco Sport E-Commerce
 */

import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma.js';
import {
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
  accessTokenPayload,
  refreshTokenPayload,
  isRefreshTokenCurrent,
} from '../utils/jwt.js';
import { sendWelcomeEmail, sendVerificationEmail, sendPasswordResetEmail } from '../services/email.service.js';
import {
  TOKEN_TYPES,
  issueToken,
  consumeToken,
  revokeTokens,
} from '../services/token.service.js';

const FORGOT_PASSWORD_MESSAGE = 'Si el correo está registrado, recibirá instrucciones para restablecer su contraseña';

/**
 * Create a verification token and email the link. Never throws: callers must not fail
 * (or leak) because the email could not be prepared.
 */
export const sendVerificationLink = async (user, { revokePrevious = false } = {}) => {
  try {
    const token = await issueToken(user.id, TOKEN_TYPES.VERIFY_EMAIL, { revokePrevious });
    sendVerificationEmail(user, token).catch(err => console.error('Failed to send verification email:', err));
  } catch (err) {
    console.error('Failed to issue verification token:', err);
  }
};

/**
 * Register new user
 * POST /api/auth/register
 */
export const register = async (req, res, next) => {
  try {
    const { email, password, first_name, last_name, phone } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'EMAIL_EXISTS',
          message: 'El email ya está registrado',
        },
      });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password_hash,
        first_name,
        last_name,
        phone,
        role: 'CUSTOMER',
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone: true,
        role: true,
        email_verified: true,
        is_active: true,
        created_at: true,
        updated_at: true,
      },
    });

    // Generate tokens
    const token = generateToken(accessTokenPayload(user));

    const refreshToken = generateRefreshToken(refreshTokenPayload({ id: user.id }));

    // Send welcome and verification emails (the transport is not awaited)
    sendWelcomeEmail(user).catch(err => console.error('Failed to send welcome email:', err));
    await sendVerificationLink(user);

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        token,
        refreshToken,
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Credenciales inválidas',
        },
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Credenciales inválidas',
        },
      });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'USER_INACTIVE',
          message: 'Cuenta desactivada. Contacte a soporte.',
        },
      });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { last_login: new Date() },
    });

    // Generate token
    const token = generateToken(accessTokenPayload(user));

    const refreshToken = generateRefreshToken(refreshTokenPayload(user));

    // Remove internal fields from response
    const { password_hash, password_changed_at, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      data: {
        token,
        refreshToken,
        user: userWithoutPassword,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user
 * GET /api/auth/me
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone: true,
        role: true,
        email_verified: true,
        is_active: true,
        last_login: true,
        created_at: true,
        updated_at: true,
      },
    });

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Refresh token requerido',
        },
      });
    }

    // Verify token
    const decoded = verifyRefreshToken(refreshToken);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_USER',
          message: 'Usuario no válido',
        },
      });
    }

    // A password reset invalidates the sessions started before it
    if (!isRefreshTokenCurrent(decoded, user)) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Sesión expirada, por favor inicie sesión nuevamente',
        },
      });
    }

    // Generate new access token
    const token = generateToken(accessTokenPayload(user));

    res.json({
      success: true,
      data: {
        token,
      },
    });
  } catch (error) {
    if (error.message === 'Refresh token inválido o expirado') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Sesión expirada, por favor inicie sesión nuevamente',
        },
      });
    }
    next(error);
  }
};

/**
 * Verify email with the emailed token
 * POST /api/auth/verify-email
 */
export const verifyEmail = async (req, res, next) => {
  try {
    const verified = await prisma.$transaction(async (tx) => {
      const userId = await consumeToken(req.body.token, TOKEN_TYPES.VERIFY_EMAIL, tx);
      if (!userId) return false;
      await tx.user.update({ where: { id: userId }, data: { email_verified: true } });
      return true;
    });

    if (!verified) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'El enlace de verificación no es válido o ha expirado',
        },
      });
    }

    res.json({ success: true, message: 'Correo verificado correctamente' });
  } catch (error) {
    next(error);
  }
};

/**
 * Send a new verification email to the logged-in user
 * POST /api/auth/resend-verification
 */
export const resendVerification = async (req, res, next) => {
  try {
    if (req.user.email_verified) {
      return res.json({ success: true, message: 'Su correo electrónico ya está verificado' });
    }

    await sendVerificationLink(req.user, { revokePrevious: true });

    res.json({ success: true, message: 'Le enviamos un nuevo correo de verificación' });
  } catch (error) {
    next(error);
  }
};

/**
 * Request a password reset email
 * POST /api/auth/forgot-password
 *
 * Known and unknown emails get the same answer after the same single query. For a known
 * email the token (previous links are revoked) and the email are created after the answer
 * is sent, so the response time never tells the two apart.
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { email: req.body.email } });

    res.json({ success: true, message: FORGOT_PASSWORD_MESSAGE });

    if (user && user.is_active) {
      setImmediate(async () => {
        try {
          const token = await issueToken(user.id, TOKEN_TYPES.RESET_PASSWORD, { revokePrevious: true });
          await sendPasswordResetEmail(user, token);
        } catch (err) {
          console.error('Failed to send password reset email:', err);
        }
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Set a new password with the emailed token
 * POST /api/auth/reset-password
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const password_hash = await bcrypt.hash(password, 12);

    const done = await prisma.$transaction(async (tx) => {
      const userId = await consumeToken(token, TOKEN_TYPES.RESET_PASSWORD, tx);
      if (!userId) return false;

      await tx.user.update({
        where: { id: userId },
        data: { password_hash, password_changed_at: new Date() },
      });
      await revokeTokens(userId, TOKEN_TYPES.RESET_PASSWORD, tx);
      return true;
    });

    if (!done) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'El enlace para restablecer la contraseña no es válido o ha expirado',
        },
      });
    }

    res.json({
      success: true,
      message: 'Contraseña actualizada correctamente. Inicie sesión con su nueva contraseña',
    });
  } catch (error) {
    next(error);
  }
};
