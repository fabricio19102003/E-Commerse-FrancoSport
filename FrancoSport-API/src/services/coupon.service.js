/**
 * Coupon Service
 * Franco Sport E-Commerce
 *
 * Coupon rules, discount math and the usage counter. A coupon is validated on
 * the server only; the discount applies to the subtotal (shipping never).
 */

import { Prisma } from '@prisma/client';
// order.service also imports from this module; each only uses the other inside functions
import { OrderError, loadPricedLines, roundMoney } from './order.service.js';

const { Decimal } = Prisma;

/** What the customer reads for each broken rule (`reopenReason` is what the admin reads) */
const failure = (code, message, reopenReason) => ({ code, message, reopenReason });

const invalidCoupon = (coupon) =>
  failure('COUPON_INVALID', 'Cupón no válido o vencido', `el cupón ${coupon?.code ?? ''} ya no es válido o venció`);

const unsupportedCoupon = (coupon) =>
  failure(
    'COUPON_INVALID',
    'Este tipo de cupón todavía no está disponible en el checkout',
    `el cupón ${coupon.code} ya no es válido o venció`
  );

const minimumPurchase = (coupon) => {
  const minimum = roundMoney(coupon.minimum_purchase_amount).toFixed(2);
  return failure(
    'COUPON_MIN_PURCHASE',
    `El cupón requiere una compra mínima de Bs. ${minimum}`,
    `el cupón ${coupon.code} requiere una compra mínima de Bs. ${minimum}`
  );
};

const totalLimitReached = (coupon) =>
  failure(
    'COUPON_LIMIT_REACHED',
    'Este cupón ya alcanzó su límite de usos',
    `el cupón ${coupon.code} alcanzó su límite de usos`
  );

const userLimitReached = (coupon) =>
  failure(
    'COUPON_USER_LIMIT',
    'Ya usó este cupón el máximo de veces permitido',
    `el cliente ya usó el cupón ${coupon.code} el máximo de veces permitido`
  );

/** Throws the failure as the customer's error, or as the admin's when reopening an order */
const raise = (found, { reopen = false } = {}) => {
  if (reopen) {
    throw new OrderError(`No se puede reabrir el pedido: ${found.reopenReason}`, { code: 'CANNOT_REOPEN' });
  }
  throw new OrderError(found.message, { code: found.code });
};

/** The code as entered by the customer: trimmed and upper case (codes are stored upper case) */
export const normalizeCouponCode = (code) => (typeof code === 'string' ? code.trim().toUpperCase() : '');

/**
 * Discount of a coupon on a subtotal, rounded half up to 2 places:
 * PERCENTAGE of the subtotal capped by maximum_discount_amount, FIXED_AMOUNT as is;
 * never more than the subtotal.
 */
export const calculateCouponDiscount = (coupon, subtotal) => {
  const base = new Decimal(subtotal);
  let discount;
  if (coupon.discount_type === 'PERCENTAGE') {
    discount = roundMoney(base.times(coupon.discount_value).dividedBy(100));
    if (coupon.maximum_discount_amount !== null) {
      discount = Decimal.min(discount, roundMoney(coupon.maximum_discount_amount));
    }
  } else {
    discount = roundMoney(coupon.discount_value);
  }
  return Decimal.max(Decimal.min(discount, base), 0);
};

// Rules that depend only on the coupon and the subtotal
const staticFailure = (coupon, subtotal, now) => {
  if (!coupon || !coupon.is_active || coupon.starts_at > now || coupon.expires_at < now) {
    return invalidCoupon(coupon);
  }
  if (!['PERCENTAGE', 'FIXED_AMOUNT'].includes(coupon.discount_type)) {
    return unsupportedCoupon(coupon);
  }
  if (coupon.minimum_purchase_amount !== null && new Decimal(subtotal).lt(coupon.minimum_purchase_amount)) {
    return minimumPurchase(coupon);
  }
  return null;
};

/**
 * Non-cancelled orders of the customer with the coupon. With `lock` it is a locking read
 * (current data, not the transaction snapshot), so it runs after the coupon row is locked
 * by takeCouponUse and concurrent orders of one customer see each other.
 */
const countUserUses = async (db, coupon, userId, { lock = false, excludeOrderId = 0 } = {}) => {
  if (lock) {
    const rows = await db.$queryRaw`
      SELECT id FROM orders
      WHERE user_id = ${userId} AND coupon_id = ${coupon.id} AND status <> 'CANCELLED' AND id <> ${excludeOrderId}
      FOR UPDATE`;
    return rows.length;
  }
  return db.order.count({
    where: { user_id: userId, coupon_id: coupon.id, status: { not: 'CANCELLED' }, id: { not: excludeOrderId } },
  });
};

const userLimitFailure = async (db, coupon, userId, options) => {
  if (coupon.usage_limit_per_user === null) return null;
  const used = await countUserUses(db, coupon, userId, options);
  return used >= coupon.usage_limit_per_user ? userLimitReached(coupon) : null;
};

/**
 * Look the coupon up by code and check the rules that need no counter
 * (active, dates, type, minimum purchase on the subtotal).
 *
 * @returns {Promise<{ coupon: object, discount: Decimal }>}
 */
export const findUsableCoupon = async (db, code, subtotal, now = new Date()) => {
  const coupon = await db.coupon.findUnique({ where: { code: normalizeCouponCode(code) } });
  const broken = staticFailure(coupon, subtotal, now);
  if (broken) raise(broken);
  return { coupon, discount: calculateCouponDiscount(coupon, subtotal) };
};

/**
 * Take one use of the coupon inside the order transaction. The counter moves with a
 * conditional update (times_used below usage_limit_total when set), so concurrent orders
 * cannot exceed the limit; the update also locks the coupon row, which serializes the
 * per-customer check that follows.
 */
export const takeCouponUse = async (tx, coupon, userId, { reopen = false, excludeOrderId } = {}) => {
  const taken = await tx.coupon.updateMany({
    where: {
      id: coupon.id,
      ...(coupon.usage_limit_total !== null && { times_used: { lt: coupon.usage_limit_total } }),
    },
    data: { times_used: { increment: 1 } },
  });
  if (taken.count === 0) raise(totalLimitReached(coupon), { reopen });

  const exceeded = await userLimitFailure(tx, coupon, userId, { lock: true, excludeOrderId });
  if (exceeded) raise(exceeded, { reopen });
};

/**
 * Give back the use an order holds (cancellation). Never below zero.
 * Runs once per cancellation because only the winner of the cancel claim gets here.
 */
export const releaseCouponUse = async (tx, order) => {
  if (!order.coupon_id) return;
  await tx.coupon.updateMany({
    where: { id: order.coupon_id, times_used: { gt: 0 } },
    data: { times_used: { decrement: 1 } },
  });
};

/**
 * Take the coupon use again when a cancelled order is reopened: the coupon must still be
 * valid for the order subtotal and have uses left, otherwise the reopening fails (OrderError,
 * so the whole transaction rolls back). The stored discount is not recomputed.
 */
export const retakeCouponUse = async (tx, order) => {
  if (!order.coupon_id) return;
  const coupon = await tx.coupon.findUnique({ where: { id: order.coupon_id } });
  const broken = staticFailure(coupon, order.subtotal, new Date());
  if (broken) raise(broken, { reopen: true });
  await takeCouponUse(tx, coupon, order.user_id, { reopen: true, excludeOrderId: order.id });
};

/**
 * What the checkout shows for a code on a list of cart lines: the same rules as order
 * creation, evaluated on the server from database prices. It reserves nothing.
 */
export const previewCoupon = async (db, { code, userId, items }) => {
  const { subtotal } = await loadPricedLines(db, items);
  const { coupon, discount } = await findUsableCoupon(db, code, subtotal);

  if (coupon.usage_limit_total !== null && coupon.times_used >= coupon.usage_limit_total) {
    raise(totalLimitReached(coupon));
  }
  const exceeded = await userLimitFailure(db, coupon, userId);
  if (exceeded) raise(exceeded);

  return { coupon, subtotal: roundMoney(subtotal), discount };
};
