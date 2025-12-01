/**
 * Admin Users Controller
 * Franco Sport API
 * 
 * Gestión administrativa de usuarios
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Get all users (admin view)
 * GET /api/admin/users
 */
export const getUsers = async (req, res, next) => {
  try {
    const { role, is_active, search, page = 1, limit = 20 } = req.query;

    // Build filters
    const where = {};

    if (role) where.role = role;
    if (is_active !== undefined) where.is_active = is_active === 'true';

    if (search) {
      where.OR = [
        { first_name: { contains: search } },
        { last_name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    // Get total count
    const total = await prisma.user.count({ where });

    // Get users
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        phone: true,
        role: true,
        email_verified: true,
        is_active: true,
        last_login: true,
        created_at: true,
        _count: {
          select: {
            orders: true,
          },
        },
        orders: {
          where: {
            payment_status: 'PAID',
          },
          select: {
            total_amount: true,
          },
        },
      },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
      orderBy: { created_at: 'desc' },
    });

    // Format response with stats
    const formattedUsers = users.map((user) => {
      const totalSpent = user.orders.reduce(
        (sum, order) => sum + parseFloat(order.total_amount.toString()),
        0
      );

      return {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.is_active,
        emailVerified: user.email_verified,
        ordersCount: user._count.orders,
        totalSpent,
        createdAt: user.created_at,
        lastLogin: user.last_login,
      };
    });

    res.json({
      success: true,
      data: formattedUsers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        total_pages: Math.ceil(total / parseInt(limit)),
        has_next: parseInt(page) < Math.ceil(total / parseInt(limit)),
        has_prev: parseInt(page) > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single user (admin view)
 * GET /api/admin/users/:id
 */
export const getUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        phone: true,
        role: true,
        email_verified: true,
        is_active: true,
        last_login: true,
        created_at: true,
        updated_at: true,
        _count: {
          select: {
            orders: true,
            addresses: true,
            reviews: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Usuario no encontrado',
        },
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user
 * PUT /api/admin/users/:id
 */
export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, email, phone, role, is_active, email_verified } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Usuario no encontrado',
        },
      });
    }

    // Check if email is taken by another user
    if (email && email !== existingUser.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email },
      });

      if (emailTaken) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'EMAIL_TAKEN',
            message: 'El email ya está en uso',
          },
        });
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        first_name,
        last_name,
        email,
        phone,
        role,
        is_active,
        email_verified,
        updated_at: new Date(),
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
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
      data: updatedUser,
      message: 'Usuario actualizado exitosamente',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle user active status
 * PATCH /api/admin/users/:id/toggle-status
 */
export const toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Prevent admin from deactivating themselves
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CANNOT_DEACTIVATE_SELF',
          message: 'No puedes desactivar tu propia cuenta',
        },
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
    });

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { is_active: !user.is_active },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        role: true,
        is_active: true,
      },
    });

    res.json({
      success: true,
      data: updatedUser,
      message: `Usuario ${updatedUser.is_active ? 'activado' : 'desactivado'} exitosamente`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change user role
 * PATCH /api/admin/users/:id/role
 */
export const changeUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Prevent admin from changing their own role
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CANNOT_CHANGE_OWN_ROLE',
          message: 'No puedes cambiar tu propio rol',
        },
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { role },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        role: true,
      },
    });

    res.json({
      success: true,
      data: updatedUser,
      message: 'Rol de usuario actualizado exitosamente',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user (soft delete)
 * DELETE /api/admin/users/:id
 */
export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CANNOT_DELETE_SELF',
          message: 'No puedes eliminar tu propia cuenta',
        },
      });
    }

    // Check if user has active orders
    const activeOrders = await prisma.order.count({
      where: {
        user_id: parseInt(id),
        status: {
          in: ['PENDING', 'PROCESSING', 'PAID', 'SHIPPED'],
        },
      },
    });

    if (activeOrders > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'USER_HAS_ACTIVE_ORDERS',
          message: 'No se puede eliminar un usuario con pedidos activos',
        },
      });
    }

    // Soft delete (mark as inactive)
    await prisma.user.update({
      where: { id: parseInt(id) },
      data: { is_active: false },
    });

    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user statistics
 * GET /api/admin/users/stats
 */
export const getUserStats = async (req, res, next) => {
  try {
    const [totalUsers, activeUsers, customers, admins, moderators] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { is_active: true } }),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count({ where: { role: 'MODERATOR' } }),
    ]);

    // Calculate total revenue
    const paidOrders = await prisma.order.findMany({
      where: { payment_status: 'PAID' },
      select: { total_amount: true },
    });

    const totalRevenue = paidOrders.reduce((sum, order) => sum + parseFloat(order.total_amount.toString()), 0);

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        customers,
        admins,
        moderators,
        totalRevenue,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user orders (admin view)
 * GET /api/admin/users/:id/orders
 */
export const getUserOrders = async (req, res, next) => {
  try {
    const { id } = req.params;

    const orders = await prisma.order.findMany({
      where: { user_id: parseInt(id) },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  where: { is_primary: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change user password (admin)
 * PATCH /api/admin/users/:id/password
 */
export const changeUserPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 8) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PASSWORD',
          message: 'La contraseña debe tener al menos 8 caracteres',
        },
      });
    }

    // Prevent admin from changing their own password via this endpoint (should use profile)
    // Although sometimes admins might want to reset their own password here too. 
    // Let's allow it but log it or just allow it.
    
    // Hash password
    const password_hash = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: parseInt(id) },
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
