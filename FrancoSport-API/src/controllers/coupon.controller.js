/**
 * Coupon Controller
 * Franco Sport E-Commerce
 */

import prisma from '../utils/prisma.js';
import { OrderError } from '../services/order.service.js';
import { previewCoupon } from '../services/coupon.service.js';

/**
 * Validate a coupon against the customer's cart
 * POST /api/coupons/validate
 *
 * The subtotal is computed here from database prices, never read from the client.
 * Nothing is reserved: the order total is computed only when the order is created.
 */
export const validateCoupon = async (req, res, next) => {
  try {
    const userId = req.user.id;
    let items = req.body.items;

    if (!items) {
      const cart = await prisma.cart.findFirst({
        where: { user_id: userId },
        include: { items: true },
      });
      items = (cart?.items ?? []).map(({ product_id, variant_id, quantity }) => ({ product_id, variant_id, quantity }));
    }

    if (items.length === 0) {
      throw new OrderError('Su carrito está vacío', { code: 'EMPTY_CART' });
    }

    const { coupon, subtotal, discount } = await previewCoupon(prisma, { code: req.body.code, userId, items });

    res.json({
      success: true,
      data: {
        code: coupon.code,
        description: coupon.description,
        discount_type: coupon.discount_type,
        subtotal: subtotal.toFixed(2),
        discount_amount: discount.toFixed(2),
      },
    });
  } catch (error) {
    if (error instanceof OrderError) {
      return res.status(error.status).json({
        success: false,
        error: { code: error.code, message: error.message },
      });
    }
    next(error);
  }
};
