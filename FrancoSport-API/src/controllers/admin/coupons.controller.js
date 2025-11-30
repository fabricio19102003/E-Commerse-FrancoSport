/**
 * Admin Coupons Controller
 * Franco Sport API
 * 
 * Gestión administrativa de cupones de descuento
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get all coupons (admin view)
 * GET /api/admin/coupons
 */
export const getCoupons = async (req, res, next) => {
  try {
    const { search, is_active, page = 1, limit = 20 } = req.query;

    // Build filters
    const where = {};

    if (search) {
      where.code = { contains: search };
    }

    if (is_active !== undefined) {
      where.is_active = is_active === 'true';
    }

    // Get total count
    const total = await prisma.coupon.count({ where });

    // Get coupons
    const coupons = await prisma.coupon.findMany({
      where,
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
      orderBy: { created_at: 'desc' },
    });

    res.json({
      success: true,
      data: coupons,
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
 * Get single coupon
 * GET /api/admin/coupons/:id
 */
export const getCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;

    const coupon = await prisma.coupon.findUnique({
      where: { id: parseInt(id) }
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'COUPON_NOT_FOUND',
          message: 'Cupón no encontrado',
        },
      });
    }

    res.json({
      success: true,
      data: coupon,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create coupon
 * POST /api/admin/coupons
 */
export const createCoupon = async (req, res, next) => {
  try {
    const {
      code,
      discount_type,
      discount_value,
      min_purchase_amount,
      max_discount_amount,
      start_date,
      end_date,
      usage_limit,
      is_active
    } = req.body;

    // Check if code exists
    const existingCode = await prisma.coupon.findUnique({
      where: { code }
    });

    if (existingCode) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'DUPLICATE_CODE',
          message: 'El código de cupón ya existe',
        },
      });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        discount_type,
        discount_value: parseFloat(discount_value),
        min_purchase_amount: min_purchase_amount ? parseFloat(min_purchase_amount) : null,
        max_discount_amount: max_discount_amount ? parseFloat(max_discount_amount) : null,
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        usage_limit: usage_limit ? parseInt(usage_limit) : null,
        is_active: is_active === true
      }
    });

    res.status(201).json({
      success: true,
      data: coupon,
      message: 'Cupón creado exitosamente',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update coupon
 * PUT /api/admin/coupons/:id
 */
export const updateCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      code,
      discount_type,
      discount_value,
      min_purchase_amount,
      max_discount_amount,
      start_date,
      end_date,
      usage_limit,
      is_active
    } = req.body;

    // Check if coupon exists
    const existingCoupon = await prisma.coupon.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingCoupon) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'COUPON_NOT_FOUND',
          message: 'Cupón no encontrado',
        },
      });
    }

    // Check code uniqueness if changed
    if (code && code !== existingCoupon.code) {
      const existingCode = await prisma.coupon.findUnique({
        where: { code }
      });

      if (existingCode) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'DUPLICATE_CODE',
            message: 'El código de cupón ya existe',
          },
        });
      }
    }

    const coupon = await prisma.coupon.update({
      where: { id: parseInt(id) },
      data: {
        code: code ? code.toUpperCase() : undefined,
        discount_type,
        discount_value: discount_value ? parseFloat(discount_value) : undefined,
        min_purchase_amount: min_purchase_amount !== undefined ? (min_purchase_amount ? parseFloat(min_purchase_amount) : null) : undefined,
        max_discount_amount: max_discount_amount !== undefined ? (max_discount_amount ? parseFloat(max_discount_amount) : null) : undefined,
        start_date: start_date ? new Date(start_date) : undefined,
        end_date: end_date ? new Date(end_date) : undefined,
        usage_limit: usage_limit !== undefined ? (usage_limit ? parseInt(usage_limit) : null) : undefined,
        is_active: is_active !== undefined ? is_active : undefined
      }
    });

    res.json({
      success: true,
      data: coupon,
      message: 'Cupón actualizado exitosamente',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete coupon
 * DELETE /api/admin/coupons/:id
 */
export const deleteCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if coupon has been used
    const coupon = await prisma.coupon.findUnique({
      where: { id: parseInt(id) }
    });

    if (coupon && coupon.used_count > 0) {
      // Soft delete if used
      await prisma.coupon.update({
        where: { id: parseInt(id) },
        data: { is_active: false }
      });
      
      return res.json({
        success: true,
        message: 'Cupón desactivado (no se puede eliminar porque ya ha sido usado)',
      });
    }

    // Hard delete if never used
    await prisma.coupon.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Cupón eliminado exitosamente',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle coupon status
 * PATCH /api/admin/coupons/:id/toggle-status
 */
export const toggleCouponStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    const coupon = await prisma.coupon.findUnique({
      where: { id: parseInt(id) }
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'COUPON_NOT_FOUND',
          message: 'Cupón no encontrado',
        },
      });
    }

    const updatedCoupon = await prisma.coupon.update({
      where: { id: parseInt(id) },
      data: { is_active: !coupon.is_active }
    });

    res.json({
      success: true,
      data: updatedCoupon,
      message: `Cupón ${updatedCoupon.is_active ? 'activado' : 'desactivado'} exitosamente`,
    });
  } catch (error) {
    next(error);
  }
};
