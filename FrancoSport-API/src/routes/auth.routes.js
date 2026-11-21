/**
 * Auth Routes
 * Franco Sport E-Commerce
 */

import express from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  getMe,
  refreshToken,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

// Same rule for registration and password reset
const passwordRule = body('password')
  .isLength({ min: 8 })
  .withMessage('La contraseña debe tener al menos 8 caracteres');

export const createAuthRoutes = (limiters) => {
  const router = express.Router();

  /**
   * @route   POST /api/auth/register
   * @desc    Register new user
   * @access  Public
   */
  router.post(
    '/register',
    limiters.register,
    [
      body('email').isEmail().withMessage('Email inválido'),
      passwordRule,
      body('first_name').notEmpty().withMessage('El nombre es obligatorio'),
      body('last_name').notEmpty().withMessage('El apellido es obligatorio'),
      validate,
    ],
    register
  );

  /**
   * @route   POST /api/auth/login
   * @desc    Login user
   * @access  Public
   */
  router.post(
    '/login',
    limiters.login,
    [
      body('email').isEmail().withMessage('Email inválido'),
      body('password').notEmpty().withMessage('La contraseña es obligatoria'),
      validate,
    ],
    login
  );

  /**
   * @route   POST /api/auth/refresh
   * @desc    Refresh access token
   * @access  Public
   */
  router.post(
    '/refresh',
    limiters.refresh,
    [body('refreshToken').notEmpty().withMessage('Refresh token requerido'), validate],
    refreshToken
  );

  /**
   * @route   GET /api/auth/me
   * @desc    Get current user
   * @access  Private
   */
  router.get('/me', authenticate, getMe);

  /**
   * @route   POST /api/auth/verify-email
   * @desc    Verify email with the emailed token
   * @access  Public
   */
  router.post(
    '/verify-email',
    limiters.verifyEmail,
    [body('token').isString().withMessage('El enlace de verificación no es válido').bail().notEmpty().withMessage('El enlace de verificación no es válido'), validate],
    verifyEmail
  );

  /**
   * @route   POST /api/auth/resend-verification
   * @desc    Send a new verification email
   * @access  Private
   */
  router.post('/resend-verification', authenticate, limiters.resendVerification, resendVerification);

  /**
   * @route   POST /api/auth/forgot-password
   * @desc    Request a password reset email (same answer for any email)
   * @access  Public
   */
  router.post(
    '/forgot-password',
    limiters.forgotPassword,
    [body('email').isEmail().withMessage('Email inválido'), validate],
    forgotPassword
  );

  /**
   * @route   POST /api/auth/reset-password
   * @desc    Set a new password with the emailed token
   * @access  Public
   */
  router.post(
    '/reset-password',
    limiters.resetPassword,
    [
      body('token')
        .isString()
        .withMessage('El enlace para restablecer la contraseña no es válido')
        .bail()
        .notEmpty()
        .withMessage('El enlace para restablecer la contraseña no es válido'),
      passwordRule,
      validate,
    ],
    resetPassword
  );

  return router;
};
