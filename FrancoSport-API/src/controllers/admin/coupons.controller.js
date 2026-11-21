/**
 * Admin Coupons Controller
 * Franco Sport API
 * 
 * Gestión administrativa de cupones de descuento
 */

import prisma from '../../utils/prisma.js';

/**
 * Get all coupons (admin view)
 * GET /api/admin/coupons
 */
export const getCoupons = async (req, res, next) => {
  try {
    const { search, is_active } = req.query;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);

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
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { created_at: 'desc' },
    });

    res.json({
      success: true,
      data: coupons,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
        has_next: page < Math.ceil(total / limit),
        has_prev: page > 1,
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

const COUPON_NOT_FOUND = {
  success: false,
  error: { code: 'COUPON_NOT_FOUND', message: 'Cupón no encontrado' },
};

const DUPLICATE_CODE = {
  success: false,
  error: { code: 'DUPLICATE_CODE', message: 'El código de cupón ya existe' },
};

const isDuplicateCode = (error) => error?.code === 'P2002';

// The request was validated (and the code uppercased) by the route; absent or null limits mean none
const couponData = (body) => ({
  code: body.code,
  description: body.description,
  discount_type: body.discount_type,
  discount_value: body.discount_value,
  minimum_purchase_amount: body.minimum_purchase_amount ?? null,
  maximum_discount_amount: body.maximum_discount_amount ?? null,
  usage_limit_total: body.usage_limit_total ?? null,
  usage_limit_per_user: body.usage_limit_per_user ?? null,
  starts_at: new Date(body.starts_at),
  expires_at: new Date(body.expires_at),
});

/**
 * Create coupon
 * POST /api/admin/coupons
 */
export const createCoupon = async (req, res, next) => {
  try {
    const existingCode = await prisma.coupon.findUnique({ where: { code: req.body.code } });
    if (existingCode) {
      return res.status(409).json(DUPLICATE_CODE);
    }

    const coupon = await prisma.coupon.create({
      data: { ...couponData(req.body), is_active: req.body.is_active ?? true },
    });

    res.status(201).json({
      success: true,
      data: coupon,
      message: 'Cupón creado exitosamente',
    });
  } catch (error) {
    if (isDuplicateCode(error)) return res.status(409).json(DUPLICATE_CODE);
    next(error);
  }
};

/**
 * Update coupon (replaces the editable fields; times_used is never touched)
 * PUT /api/admin/coupons/:id
 */
export const updateCoupon = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);

    const existingCoupon = await prisma.coupon.findUnique({ where: { id } });
    if (!existingCoupon) {
      return res.status(404).json(COUPON_NOT_FOUND);
    }

    if (req.body.code !== existingCoupon.code) {
      const existingCode = await prisma.coupon.findUnique({ where: { code: req.body.code } });
      if (existingCode) {
        return res.status(409).json(DUPLICATE_CODE);
      }
    }

    const coupon = await prisma.coupon.update({
      where: { id },
      data: { ...couponData(req.body), is_active: req.body.is_active ?? existingCoupon.is_active },
    });

    res.json({
      success: true,
      data: coupon,
      message: 'Cupón actualizado exitosamente',
    });
  } catch (error) {
    if (isDuplicateCode(error)) return res.status(409).json(DUPLICATE_CODE);
    next(error);
  }
};

/**
 * Delete coupon (deactivate it when it was ever used or is on an order)
 * DELETE /api/admin/coupons/:id
 */
export const deleteCoupon = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);

    const coupon = await prisma.coupon.findUnique({
      where: { id },
      include: { _count: { select: { orders: true } } },
    });
    if (!coupon) {
      return res.status(404).json(COUPON_NOT_FOUND);
    }

    if (coupon.times_used > 0 || coupon._count.orders > 0) {
      await prisma.coupon.update({ where: { id }, data: { is_active: false } });

      return res.json({
        success: true,
        message: 'Cupón desactivado (no se puede eliminar porque ya ha sido usado)',
      });
    }

    await prisma.coupon.delete({ where: { id } });

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
