/**
 * Shipping Controller (public)
 * Franco Sport E-Commerce
 */

import prisma from '../utils/prisma.js';

/**
 * Get active shipping methods in active zones
 * GET /api/shipping-methods
 */
export const getShippingMethods = async (req, res, next) => {
  try {
    const methods = await prisma.shippingMethod.findMany({
      where: { is_active: true, shipping_zone: { is_active: true } },
      select: {
        id: true,
        name: true,
        description: true,
        base_cost: true,
        cost_per_kg: true,
        estimated_days_min: true,
        estimated_days_max: true,
      },
      orderBy: [{ base_cost: 'asc' }, { id: 'asc' }],
    });

    res.json({
      success: true,
      data: methods,
    });
  } catch (error) {
    next(error);
  }
};
