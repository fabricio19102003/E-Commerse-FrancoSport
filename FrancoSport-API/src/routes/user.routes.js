/**
 * User Routes
 * Franco Sport E-Commerce
 */

import express from 'express';
import { body } from 'express-validator';
import {
  getProfile,
  updateProfile,
  changePassword,
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
} from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

// All user routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/users/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', getProfile);

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put(
  '/profile',
  [
    body('first_name').notEmpty().withMessage('El nombre es obligatorio'),
    body('last_name').notEmpty().withMessage('El apellido es obligatorio'),
    validate,
  ],
  updateProfile
);

/**
 * @route   PUT /api/users/password
 * @desc    Change password
 * @access  Private
 */
router.put(
  '/password',
  [
    body('current_password').notEmpty().withMessage('La contraseña actual es obligatoria'),
    body('new_password')
      .isLength({ min: 8 })
      .withMessage('La nueva contraseña debe tener al menos 8 caracteres'),
    validate,
  ],
  changePassword
);

/**
 * @route   GET /api/users/addresses
 * @desc    Get user addresses
 * @access  Private
 */
router.get('/addresses', getAddresses);

/**
 * @route   POST /api/users/addresses
 * @desc    Create address
 * @access  Private
 */
router.post(
  '/addresses',
  [
    body('address_type')
      .isIn(['SHIPPING', 'BILLING'])
      .withMessage('Tipo de dirección inválido'),
    body('full_name').notEmpty().withMessage('El nombre completo es obligatorio'),
    body('street_address').notEmpty().withMessage('La dirección es obligatoria'),
    body('city').notEmpty().withMessage('La ciudad es obligatoria'),
    body('state').notEmpty().withMessage('El estado es obligatorio'),
    body('postal_code').notEmpty().withMessage('El código postal es obligatorio'),
    body('country').notEmpty().withMessage('El país es obligatorio'),
    body('phone').notEmpty().withMessage('El teléfono es obligatorio'),
    validate,
  ],
  createAddress
);

/**
 * @route   PUT /api/users/addresses/:addressId
 * @desc    Update address
 * @access  Private
 */
router.put(
  '/addresses/:addressId',
  [
    body('address_type')
      .isIn(['SHIPPING', 'BILLING'])
      .withMessage('Tipo de dirección inválido'),
    body('full_name').notEmpty().withMessage('El nombre completo es obligatorio'),
    body('street_address').notEmpty().withMessage('La dirección es obligatoria'),
    body('city').notEmpty().withMessage('La ciudad es obligatoria'),
    body('state').notEmpty().withMessage('El estado es obligatorio'),
    body('postal_code').notEmpty().withMessage('El código postal es obligatorio'),
    body('country').notEmpty().withMessage('El país es obligatorio'),
    body('phone').notEmpty().withMessage('El teléfono es obligatorio'),
    validate,
  ],
  updateAddress
);

/**
 * @route   DELETE /api/users/addresses/:addressId
 * @desc    Delete address
 * @access  Private
 */
router.delete('/addresses/:addressId', deleteAddress);

export default router;
