/**
 * User Controller
 * Franco Sport E-Commerce
 */

import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma.js';

/**
 * Get user profile
 * GET /api/users/profile
 */
export const getProfile = async (req, res, next) => {
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
 * Update user profile
 * PUT /api/users/profile
 */
export const updateProfile = async (req, res, next) => {
  try {
    const { first_name, last_name, phone } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        first_name,
        last_name,
        phone,
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

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change password
 * PUT /api/users/password
 */
export const changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    // Verify current password
    const isValidPassword = await bcrypt.compare(current_password, user.password_hash);

    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PASSWORD',
          message: 'Contraseña actual incorrecta',
        },
      });
    }

    // Hash new password
    const password_hash = await bcrypt.hash(new_password, 12);

    // Update password
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password_hash },
    });

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user addresses
 * GET /api/users/addresses
 */
export const getAddresses = async (req, res, next) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { user_id: req.user.id },
      orderBy: {
        is_default: 'desc',
      },
    });

    res.json({
      success: true,
      data: addresses,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create address
 * POST /api/users/addresses
 */
export const createAddress = async (req, res, next) => {
  try {
    const {
      address_type,
      full_name,
      street_address,
      city,
      state,
      postal_code,
      country,
      phone,
      is_default,
    } = req.body;

    // If is_default, unset other defaults
    if (is_default) {
      await prisma.address.updateMany({
        where: {
          user_id: req.user.id,
          address_type,
        },
        data: {
          is_default: false,
        },
      });
    }

    const address = await prisma.address.create({
      data: {
        user_id: req.user.id,
        address_type,
        full_name,
        street_address,
        city,
        state,
        postal_code,
        country,
        phone,
        is_default: is_default || false,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Dirección creada exitosamente',
      data: address,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update address
 * PUT /api/users/addresses/:addressId
 */
export const updateAddress = async (req, res, next) => {
  try {
    const { addressId } = req.params;
    const {
      address_type,
      full_name,
      street_address,
      city,
      state,
      postal_code,
      country,
      phone,
      is_default,
    } = req.body;

    // Verify address belongs to user
    const existingAddress = await prisma.address.findUnique({
      where: { id: parseInt(addressId) },
    });

    if (!existingAddress || existingAddress.user_id !== req.user.id) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ADDRESS_NOT_FOUND',
          message: 'Dirección no encontrada',
        },
      });
    }

    // If is_default, unset other defaults
    if (is_default) {
      await prisma.address.updateMany({
        where: {
          user_id: req.user.id,
          address_type,
          id: { not: parseInt(addressId) },
        },
        data: {
          is_default: false,
        },
      });
    }

    const address = await prisma.address.update({
      where: { id: parseInt(addressId) },
      data: {
        address_type,
        full_name,
        street_address,
        city,
        state,
        postal_code,
        country,
        phone,
        is_default,
      },
    });

    res.json({
      success: true,
      message: 'Dirección actualizada exitosamente',
      data: address,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete address
 * DELETE /api/users/addresses/:addressId
 */
export const deleteAddress = async (req, res, next) => {
  try {
    const { addressId } = req.params;

    // Verify address belongs to user
    const address = await prisma.address.findUnique({
      where: { id: parseInt(addressId) },
    });

    if (!address || address.user_id !== req.user.id) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ADDRESS_NOT_FOUND',
          message: 'Dirección no encontrada',
        },
      });
    }

    await prisma.address.delete({
      where: { id: parseInt(addressId) },
    });

    res.json({
      success: true,
      message: 'Dirección eliminada exitosamente',
    });
  } catch (error) {
    next(error);
  }
};
