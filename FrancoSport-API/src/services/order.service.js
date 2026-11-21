/**
 * Order Service
 * Franco Sport E-Commerce
 *
 * Shared order rules: money math, shipping cost and cancellation.
 */

import { Prisma } from '@prisma/client';
// coupon.service also imports from this module; each only uses the other inside functions
import { releaseCouponUse, retakeCouponUse } from './coupon.service.js';

const { Decimal } = Prisma;

// Statuses from which an order can still be cancelled
export const CANCELLABLE_STATUSES = ['PENDING', 'PROCESSING'];

// 100 points = 1 currency unit
export const POINTS_PER_UNIT = 100;

/**
 * Business-rule error that maps straight to the API error format
 */
export class OrderError extends Error {
  constructor(message, { status = 400, code = 'INVALID_ORDER' } = {}) {
    super(message);
    this.name = 'OrderError';
    this.status = status;
    this.code = code;
  }
}

/**
 * The same product/variant twice in a list of lines is rejected, not merged.
 * Shared by order creation and coupon validation so both answer the same.
 */
export const assertNoDuplicateLines = (items) => {
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
};

/**
 * Lock order for stock rows. Create, cancel and reopen all take stock in this
 * order, so concurrent transactions never wait on each other in a cycle.
 */
export const sortByStockLock = (items) =>
  [...items].sort((a, b) => a.product_id - b.product_id || (a.variant_id ?? 0) - (b.variant_id ?? 0));

/**
 * Run an interactive transaction, retrying once when MySQL reports a write
 * conflict or deadlock (Prisma P2034). A second failure reaches the error handler (409).
 */
export const runTransaction = async (prisma, fn) => {
  try {
    return await prisma.$transaction(fn);
  } catch (error) {
    if (error?.code !== 'P2034') throw error;
    return prisma.$transaction(fn);
  }
};

/**
 * Round a Decimal to 2 places (half up), the precision of the money columns
 */
export const roundMoney = (value) => new Decimal(value).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

/**
 * Shipping cost computed on the server:
 * base_cost + cost_per_kg × total weight (kg). Without weight it is base_cost.
 */
export const calculateShippingCost = (method, totalWeightKg) => {
  const base = new Decimal(method.base_cost);
  const weight = new Decimal(totalWeightKg);
  if (weight.lte(0)) return roundMoney(base);
  return roundMoney(base.plus(new Decimal(method.cost_per_kg).times(weight)));
};

/**
 * The shipping method of an order or a coupon preview: it must exist, be active and be in an
 * active zone. Same answer for every way of not being available.
 */
export const findAvailableShippingMethod = async (db, shippingMethodId) => {
  const method = await db.shippingMethod.findFirst({
    where: { id: shippingMethodId, is_active: true, shipping_zone: { is_active: true } },
  });
  if (!method) {
    throw new OrderError('Método de envío no disponible');
  }
  return method;
};

/**
 * Price the requested lines from the database only: existing, active products and variants,
 * a variant without its own price uses the product price. Does not touch stock.
 *
 * @returns {Promise<{ lines: object[], subtotal: Decimal, totalWeight: Decimal }>}
 */
export const loadPricedLines = async (db, items) => {
  let subtotal = new Decimal(0);
  let totalWeight = new Decimal(0);
  const lines = [];

  for (const item of items) {
    const product = await db.product.findUnique({
      where: { id: item.product_id },
      include: { variants: true },
    });

    if (!product) {
      throw new OrderError(`Producto no encontrado: ${item.product_id}`);
    }
    if (!product.is_active) {
      throw new OrderError(`El producto ${product.name} no está disponible`);
    }

    let price = new Decimal(product.price);
    let variant = null;

    if (item.variant_id) {
      variant = product.variants.find((v) => v.id === item.variant_id);
      if (!variant) {
        throw new OrderError(`Variante no encontrada: ${item.variant_id}`);
      }
      if (!variant.is_active) {
        throw new OrderError(`La variante ${variant.variant_name} no está disponible`);
      }
      // A variant without its own price uses the product price
      if (variant.price !== null) {
        price = new Decimal(variant.price);
      }
    }

    const itemSubtotal = roundMoney(price.times(item.quantity));
    subtotal = subtotal.plus(itemSubtotal);
    totalWeight = totalWeight.plus(new Decimal(product.weight).times(item.quantity));

    lines.push({ item, product, variant, price, itemSubtotal });
  }

  return { lines, subtotal, totalWeight };
};

/**
 * Cancel an order inside a transaction: marks it CANCELLED, restores stock,
 * refunds the redeemed points, releases the coupon use and records the history.
 *
 * The status change is a conditional update, so concurrent or repeated calls
 * claim the cancellation only once; everything else runs only for the winner.
 *
 * @returns {Promise<object|null>} the cancelled order, or null if it was not cancellable
 *   or its status or payment status changed since `order` was read
 */
export const cancelOrderInTransaction = async (tx, order, { reason, historyNotes, createdBy, extraData = {} }) => {
  const claimed = await tx.order.updateMany({
    // payment_status is the value the caller read (and chose extraData from): if an approval
    // landed in between, the claim is lost instead of cancelling with a stale payment status
    where: { id: order.id, status: { in: CANCELLABLE_STATUSES }, payment_status: order.payment_status },
    data: {
      status: 'CANCELLED',
      cancelled_at: new Date(),
      cancelled_reason: reason,
      ...extraData,
    },
  });

  if (claimed.count === 0) return null;

  // Return stock
  const items = sortByStockLock(await tx.orderItem.findMany({ where: { order_id: order.id } }));
  for (const item of items) {
    if (item.variant_id) {
      await tx.productVariant.update({
        where: { id: item.variant_id },
        data: { stock: { increment: item.quantity } },
      });
    } else {
      await tx.product.update({
        where: { id: item.product_id },
        data: { stock: { increment: item.quantity } },
      });
    }
  }

  // Return the points this order currently holds (redeemed minus already refunded)
  const held = await tx.loyaltyTransaction.aggregate({
    where: { order_id: order.id, type: { in: ['REDEEMED', 'REFUNDED'] } },
    _sum: { points: true },
  });
  const pointsToReturn = -(held._sum.points ?? 0);
  if (pointsToReturn > 0) {
    await tx.user.update({
      where: { id: order.user_id },
      data: { loyalty_points: { increment: pointsToReturn } },
    });
    await tx.loyaltyTransaction.create({
      data: {
        user_id: order.user_id,
        order_id: order.id,
        points: pointsToReturn,
        type: 'REFUNDED',
        description: `Puntos devueltos por cancelación del pedido #${order.order_number}`,
      },
    });
  }

  // The claim above makes this run once per cancellation
  await releaseCouponUse(tx, order);

  await tx.orderStatusHistory.create({
    data: {
      order_id: order.id,
      status: 'CANCELLED',
      notes: historyNotes,
      ...(createdBy ? { created_by: createdBy } : {}),
    },
  });

  return tx.order.findUnique({ where: { id: order.id } });
};

const lineName = (item) => (item.variant_name ? `${item.product_name} (${item.variant_name})` : item.product_name);

/**
 * Reopen a CANCELLED order inside a transaction: back to PENDING, takes the
 * stock again, deducts the redeemed points again and takes the coupon use again.
 *
 * Throws OrderError (rolling everything back) if any line lacks stock, the
 * customer lacks points or the coupon is no longer valid. The status change is a conditional update, so
 * repeated or concurrent calls reopen only once.
 *
 * @returns {Promise<object|null>} the reopened order, or null if it was not cancelled
 */
export const reopenOrderInTransaction = async (tx, order, { historyNotes, createdBy }) => {
  const claimed = await tx.order.updateMany({
    where: { id: order.id, status: 'CANCELLED' },
    data: { status: 'PENDING', cancelled_at: null, cancelled_reason: null },
  });

  if (claimed.count === 0) return null;

  // Take stock again, in a fixed order so concurrent orders do not deadlock
  const items = sortByStockLock(await tx.orderItem.findMany({ where: { order_id: order.id } }));
  for (const item of items) {
    const taken = item.variant_id
      ? await tx.productVariant.updateMany({
          where: { id: item.variant_id, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        })
      : await tx.product.updateMany({
          where: { id: item.product_id, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
    if (taken.count === 0) {
      throw new OrderError(`Stock insuficiente para ${lineName(item)} al reabrir el pedido`, { code: 'CANNOT_REOPEN' });
    }
  }

  // Deduct again exactly what the last cancel refunded (from the loyalty history,
  // so orders created before discount_amount was stored are handled too)
  const lastRefund = await tx.loyaltyTransaction.findFirst({
    where: { order_id: order.id, type: 'REFUNDED' },
    orderBy: { id: 'desc' },
  });
  const pointsToTake = lastRefund?.points ?? 0;
  if (pointsToTake > 0) {
    const taken = await tx.user.updateMany({
      where: { id: order.user_id, loyalty_points: { gte: pointsToTake } },
      data: { loyalty_points: { decrement: pointsToTake } },
    });
    if (taken.count === 0) {
      throw new OrderError(`Puntos de lealtad insuficientes para reabrir el pedido: se necesitan ${pointsToTake}`, {
        code: 'CANNOT_REOPEN',
      });
    }
    await tx.loyaltyTransaction.create({
      data: {
        user_id: order.user_id,
        order_id: order.id,
        points: -pointsToTake,
        type: 'REDEEMED',
        description: `Canje por reapertura del pedido #${order.order_number}`,
      },
    });
  }

  // Same lock order as create and cancel: stock first, then the coupon
  await retakeCouponUse(tx, order);

  // A payment refunded by the cancellation has to happen again
  const current = await tx.order.findUnique({ where: { id: order.id }, select: { payment_status: true } });
  const paymentReset = current.payment_status === 'REFUNDED';
  if (paymentReset) {
    await tx.order.update({ where: { id: order.id }, data: { payment_status: 'PENDING' } });
  }

  await tx.orderStatusHistory.create({
    data: {
      order_id: order.id,
      status: 'PENDING',
      notes: paymentReset ? `${historyNotes}. El pago vuelve a PENDING (estaba REFUNDED)` : historyNotes,
      ...(createdBy ? { created_by: createdBy } : {}),
    },
  });

  return tx.order.findUnique({ where: { id: order.id } });
};
