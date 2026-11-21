/**
 * Coupon Controller
 * Franco Sport E-Commerce
 */

import prisma from '../utils/prisma.js';
import { OrderError, assertNoDuplicateLines } from '../services/order.service.js';
import { couponAppliesTo, previewCoupon } from '../services/coupon.service.js';

/**
 * Validate a coupon against the customer's cart
 * POST /api/coupons/validate
 *
 * The subtotal is computed here from database prices, never read from the client.
 * A FREE_SHIPPING coupon needs `shipping_method_id`: its discount is that method's shipping cost.
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
    assertNoDuplicateLines(items);

    const { coupon, subtotal, shippingCost, discount } = await previewCoupon(prisma, {
      code: req.body.code,
      userId,
      items,
      shippingMethodId: req.body.shipping_method_id,
    });

    res.json({
      success: true,
      data: {
        code: coupon.code,
        description: coupon.description,
        discount_type: coupon.discount_type,
        applies_to: couponAppliesTo(coupon),
        subtotal: subtotal.toFixed(2),
        shipping_cost: shippingCost ? shippingCost.toFixed(2) : null,
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
