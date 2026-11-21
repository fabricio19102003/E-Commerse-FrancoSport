/**
 * Auth Routes
 * Franco Sport E-Commerce
 */

import express from 'express';
import { body } from 'express-validator';
import { register, login, getMe, refreshToken } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

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
      body('password')
        .isLength({ min: 8 })
        .withMessage('La contraseña debe tener al menos 8 caracteres'),
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

  return router;
};
