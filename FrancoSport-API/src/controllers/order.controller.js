/**
 * Order Controller
 * Franco Sport E-Commerce
 */

import { randomInt } from 'node:crypto';
import { Prisma } from '@prisma/client';
import prisma from '../utils/prisma.js';
import { sendOrderConfirmationEmail } from '../services/email.service.js';
import {
  CANCELLABLE_STATUSES,
  OrderError,
  POINTS_PER_UNIT,
  calculateShippingCost,
  cancelOrderInTransaction,
  loadPricedLines,
  runTransaction,
  sortByStockLock,
} from '../services/order.service.js';
import { findUsableCoupon, normalizeCouponCode, takeCouponUse } from '../services/coupon.service.js';

const { Decimal } = Prisma;

const cannotCancel = (res) =>
  res.status(400).json({
    success: false,
    error: {
      code: 'CANNOT_CANCEL',
      message: 'Este pedido no puede ser cancelado',
    },
  });

const orderChanged = (res) =>
  res.status(409).json({
    success: false,
    error: {
      code: 'ORDER_CHANGED',
      message: 'El pedido cambió mientras tanto; recargue e intente de nuevo',
    },
  });

// A lost cancel claim on an order that is still cancellable means its payment changed meanwhile
const orderStillCancellable = async (orderId) => {
  const current = await prisma.order.findUnique({ where: { id: orderId }, select: { status: true } });
  return Boolean(current) && CANCELLABLE_STATUSES.includes(current.status);
};

/**
 * Get user's orders
 * GET /api/orders
 */
export const getOrders = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    const where = { user_id: userId };

    if (status) {
      where.status = status;
    }

    const orders = await prisma.order.findMany({
      where,
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
        shipping_address: true,
        shipping_method: true,
      },
      orderBy: {
        created_at: 'desc',
      },
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
 * Get single order
 * GET /api/orders/:orderNumber
 */
export const getOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { orderNumber } = req.params;

    const order = await prisma.order.findUnique({
      where: { order_number: orderNumber },
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
            variant: true,
          },
        },
        shipping_address: true,
        shipping_method: true,
        status_history: {
          orderBy: {
            created_at: 'desc',
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Pedido no encontrado',
        },
      });
    }

    // Verify order belongs to user (unless admin)
    if (order.user_id !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'No tienes acceso a este pedido',
        },
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel order
 * POST /api/orders/:orderNumber/cancel
 */
export const cancelOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { orderNumber } = req.params;
    const { reason } = req.body;

    const order = await prisma.order.findUnique({
      where: { order_number: orderNumber },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Pedido no encontrado',
        },
      });
    }

    // Verify order belongs to user
    if (order.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'No tienes acceso a este pedido',
        },
      });
    }

    // An approved payment is refunded by the store, not cancelled by the customer
    if (order.payment_status === 'PAID') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CANNOT_CANCEL',
          message: 'Su pago ya fue aprobado: para cancelar el pedido comuníquese con la tienda',
        },
      });
    }

    // Check if order can be cancelled
    if (!CANCELLABLE_STATUSES.includes(order.status)) {
      return cannotCancel(res);
    }

    // Cancel order, restore stock and points, and record history atomically.
    // The helper claims the cancellation (status and the payment status read above), so a
    // repeated or concurrent request restores nothing and an approval landing meanwhile wins.
    const cancelled = await runTransaction(prisma, (tx) =>
      cancelOrderInTransaction(tx, order, { reason, historyNotes: reason })
    );

    if (!cancelled) {
      return (await orderStillCancellable(order.id)) ? orderChanged(res) : cannotCancel(res);
    }

    res.json({
      success: true,
      message: 'Pedido cancelado exitosamente',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create order
 * POST /api/orders
 */
export const createOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    // Amounts (prices, shipping, totals) and the payment proof are never read from the client:
    // the proof is uploaded afterwards to POST /api/payment/proof/:orderId
    const { items, shipping_address_id, shipping_method_id, payment_method } = req.body;
    const redeemPoints = req.body.redeem_points ?? 0;
    const couponCode = normalizeCouponCode(req.body.coupon_code);

    // One coupon or points, never both (checked before anything is read or changed)
    if (couponCode && redeemPoints > 0) {
      throw new OrderError('Puede usar un cupón o sus puntos, no ambos', { code: 'COUPON_POINTS_CONFLICT' });
    }

    // Same product/variant twice is rejected, not merged
    const seen = new Set();
    for (const item of items) {
      const key = `${item.product_id}:${item.variant_id ?? ''}`;
      if (seen.has(key)) {
        throw new OrderError(
          `Producto repetido en el pedido: ${item.product_id}${item.variant_id ? ` (variante ${item.variant_id})` : ''}. Combine las cantidades en una sola línea`
        );
      }
      seen.add(key);
    }

    // Start transaction
    const result = await runTransaction(prisma, async (tx) => {
      // Address must belong to the customer (same answer as a missing one)
      const address = await tx.address.findFirst({ where: { id: shipping_address_id, user_id: userId } });
      if (!address) {
        throw new OrderError('Dirección de envío no encontrada');
      }

      // Shipping method must exist, be active and be in an active zone
      const shippingMethod = await tx.shippingMethod.findFirst({
        where: { id: shipping_method_id, is_active: true, shipping_zone: { is_active: true } },
      });
      if (!shippingMethod) {
        throw new OrderError('Método de envío no disponible');
      }

      // Prices, weights and availability come only from the database
      const { lines, subtotal, totalWeight } = await loadPricedLines(tx, items);

      // Coupon rules that need no counter fail before any stock is taken
      const usable = couponCode ? await findUsableCoupon(tx, couponCode, subtotal) : null;

      // Take stock atomically: the conditional update fails if another order took it first.
      // Fixed order (product, variant) so concurrent orders do not deadlock.
      const byLock = sortByStockLock(lines.map((line) => ({ ...line, product_id: line.item.product_id, variant_id: line.item.variant_id })));
      for (const { item, product, variant } of byLock) {
        const taken = variant
          ? await tx.productVariant.updateMany({
              where: { id: variant.id, stock: { gte: item.quantity } },
              data: { stock: { decrement: item.quantity } },
            })
          : await tx.product.updateMany({
              where: { id: product.id, stock: { gte: item.quantity } },
              data: { stock: { decrement: item.quantity } },
            });
        if (taken.count === 0) {
          throw new OrderError(
            variant ? `Stock insuficiente para ${product.name} (${variant.sku})` : `Stock insuficiente para ${product.name}`
          );
        }
      }

      // The use is taken after the stock (the lock order cancel and reopen also follow); a rejection rolls back the stock
      if (usable) {
        await takeCouponUse(tx, usable.coupon, userId);
      }

      const orderItemsData = lines.map(({ item, product, variant, price, itemSubtotal }) => ({
        product_id: product.id,
        variant_id: variant ? variant.id : null,
        quantity: item.quantity,
        price_at_purchase: price,
        subtotal: itemSubtotal,
        product_name: product.name,
        variant_name: variant ? variant.variant_name : null,
      }));

      // Shipping is computed from the method and the total weight
      const shippingCost = calculateShippingCost(shippingMethod, totalWeight);
      const grossTotal = subtotal.plus(shippingCost);

      // Points: only what the total allows is used (1 point = 1/100 of currency)
      let pointsUsed = 0;
      if (redeemPoints > 0) {
        const user = await tx.user.findUnique({ where: { id: userId }, select: { loyalty_points: true } });
        if (user.loyalty_points < redeemPoints) {
          throw new OrderError('Puntos de lealtad insuficientes');
        }

        const maxPoints = grossTotal.times(POINTS_PER_UNIT).toNumber();
        pointsUsed = Math.min(redeemPoints, maxPoints);

        if (pointsUsed > 0) {
          // Conditional deduction: concurrent orders cannot spend the same points twice
          const deducted = await tx.user.updateMany({
            where: { id: userId, loyalty_points: { gte: pointsUsed } },
            data: { loyalty_points: { decrement: pointsUsed } },
          });
          if (deducted.count === 0) {
            throw new OrderError('Puntos de lealtad insuficientes');
          }
        }
      }
      // The discount is the coupon's or the points' (never both), and never touches shipping
      const discountAmount = usable ? usable.discount : new Decimal(pointsUsed).dividedBy(POINTS_PER_UNIT);
      const total = grossTotal.minus(discountAmount);

      // Generate order number (timestamp plus random suffix)
      const orderNumber = `ORD-${Date.now()}-${randomInt(0, 1000000)}`;

      // Create order
      const newOrder = await tx.order.create({
        data: {
          order_number: orderNumber,
          user_id: userId,
          shipping_address_id: address.id,
          shipping_method_id: shippingMethod.id,
          payment_method,
          status: 'PENDING',
          payment_status: 'PENDING',
          subtotal,
          shipping_cost: shippingCost,
          tax_amount: 0,
          discount_amount: discountAmount,
          coupon_id: usable ? usable.coupon.id : null,
          total_amount: total,
          items: {
            create: orderItemsData,
          },
          status_history: {
            create: {
              status: 'PENDING',
              notes: 'Pedido creado',
            },
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          user: true,
        },
      });

      // Record the redemption linked to the order
      if (pointsUsed > 0) {
        await tx.loyaltyTransaction.create({
          data: {
            user_id: userId,
            order_id: newOrder.id,
            points: -pointsUsed,
            type: 'REDEEMED',
            description: `Canje en pedido #${orderNumber}`,
          },
        });
      }

      return newOrder;
    });

    // Send confirmation email (async)
    const orderForEmail = {
      ...result,
      items: result.items.map(item => ({
        ...item,
        product_name: item.product.name,
      })),
    };
    sendOrderConfirmationEmail(orderForEmail).catch(err => console.error('Failed to send order email:', err));

    res.status(201).json({
      success: true,
      message: 'Pedido creado exitosamente',
      data: result,
    });
  } catch (error) {
    if (error instanceof OrderError) {
      return res.status(error.status).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
    }
    next(error);
  }
};
