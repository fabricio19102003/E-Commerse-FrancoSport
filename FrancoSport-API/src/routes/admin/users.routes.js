/**
 * Admin Users Routes
 * Franco Sport API
 */

import express from 'express';
import { body } from 'express-validator';
import { authenticate, requireAdmin } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import * as usersController from '../../controllers/admin/users.controller.js';

const router = express.Router();

// Apply authentication and admin check to all routes
router.use(authenticate, requireAdmin);

// GET /api/admin/users/stats - Get user statistics
router.get('/stats', usersController.getUserStats);

// GET /api/admin/users - Get all users
router.get('/', usersController.getUsers);

// GET /api/admin/users/:id - Get single user
router.get('/:id', usersController.getUser);

// GET /api/admin/users/:id/orders - Get user orders
router.get('/:id/orders', usersController.getUserOrders);

// PUT /api/admin/users/:id - Update user
router.put('/:id', usersController.updateUser);

// PATCH /api/admin/users/:id/toggle-status - Toggle active status
router.patch('/:id/toggle-status', usersController.toggleUserStatus);

// PATCH /api/admin/users/:id/role - Change user role
router.patch(
  '/:id/role',
  [
    body('role')
      .isIn(['ADMIN', 'CUSTOMER', 'MODERATOR'])
      .withMessage('Rol inválido'),
    validate,
  ],
  usersController.changeUserRole
);

// DELETE /api/admin/users/:id - Delete user
router.delete('/:id', usersController.deleteUser);

export default router;
