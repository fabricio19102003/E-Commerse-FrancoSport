import { describe, it, expect } from 'vitest';
import {
  api,
  prisma,
  createContext,
  createProduct,
  createUser,
  createAddress,
  createShippingMethod,
  createOrderViaApi,
  snapshotOf,
} from './helpers.js';

const INVALID = 'Cupón no válido o vencido';
const NOT_BOTH = 'Puede usar un cupón o sus puntos, no ambos';
const TOTAL_LIMIT = 'Este cupón ya alcanzó su límite de usos';
const USER_LIMIT = 'Ya usó este cupón el máximo de veces permitido';

let codeCounter = 0;
const DAY = 24 * 60 * 60 * 1000;

/** A valid coupon (10% off, valid from yesterday to tomorrow) with any field overridden */
const createCoupon = (overrides = {}) =>
  prisma.coupon.create({
    data: {
      code: `CP${Date.now().toString(36)}${(codeCounter++).toString(36)}`.toUpperCase(),
      description: 'Cupón de prueba',
      discount_type: 'PERCENTAGE',
      discount_value: '10.00',
      starts_at: new Date(Date.now() - DAY),
      expires_at: new Date(Date.now() + DAY),
      is_active: true,
      ...overrides,
    },
  });

const timesUsed = async (id) => (await prisma.coupon.findUnique({ where: { id } })).times_used;

const expectRejected = (res, code, message) => {
  expect(res.status).toBe(400);
  expect(res.body).toEqual({ success: false, error: { code, message } });
};

// product price 10.00 x 2 = subtotal 20.00, shipping 5.00
const withCoupon = (coupon, overrides = {}) => ({ coupon_code: coupon.code, ...overrides });

const expectTotals = (order, { subtotal, discount, shipping, total }) => {
  expect(Number(order.subtotal)).toBe(subtotal);
  expect(Number(order.discount_amount)).toBe(discount);
  expect(Number(order.shipping_cost)).toBe(shipping);
  expect(Number(order.total_amount)).toBe(total);
};

describe('POST /api/orders with coupon_code - discount (S5)', () => {
  it('applies a percentage of the subtotal and not of the shipping, storing coupon and discount', async () => {
    const ctx = await createContext();
    const coupon = await createCoupon({ discount_value: '10.00' });

    const res = await createOrderViaApi(ctx, withCoupon(coupon));

    expect(res.status).toBe(201);
    expectTotals(res.body.data, { subtotal: 20, discount: 2, shipping: 5, total: 23 });
    expect(res.body.data.coupon_id).toBe(coupon.id);
    const stored = await prisma.order.findUnique({ where: { id: res.body.data.id } });
    expect(stored.coupon_id).toBe(coupon.id);
    expect(stored.discount_amount.toFixed(2)).toBe('2.00');
    expect(stored.total_amount.toFixed(2)).toBe('23.00');
    expect(await timesUsed(coupon.id)).toBe(1);
    expect(await prisma.loyaltyTransaction.count({ where: { user_id: ctx.user.id } })).toBe(0);
  });

  it('accepts the code case-insensitively and trimmed', async () => {
    const ctx = await createContext();
    const coupon = await createCoupon();

    const res = await createOrderViaApi(ctx, { coupon_code: `  ${coupon.code.toLowerCase()}  ` });

    expect(res.status).toBe(201);
    expect(res.body.data.coupon_id).toBe(coupon.id);
    expect(await timesUsed(coupon.id)).toBe(1);
  });

  it('rounds a percentage discount half up to 2 decimals with Decimal math', async () => {
    const ctx = await createContext({ product: { price: '11.11' } });
    const coupon = await createCoupon({ discount_value: '15.00' });

    // subtotal 33.33, 15% = 4.9995 -> 5.00
    const res = await createOrderViaApi(ctx, {
      items: [{ product_id: ctx.product.id, quantity: 3 }],
      ...withCoupon(coupon),
    });

    expect(res.status).toBe(201);
    expectTotals(res.body.data, { subtotal: 33.33, discount: 5, shipping: 5, total: 33.33 });
  });

  it('caps a percentage discount at maximum_discount_amount', async () => {
    const ctx = await createContext();
    const coupon = await createCoupon({ discount_value: '50.00', maximum_discount_amount: '3.00' });

    const res = await createOrderViaApi(ctx, withCoupon(coupon));

    expect(res.status).toBe(201);
    expectTotals(res.body.data, { subtotal: 20, discount: 3, shipping: 5, total: 22 });
  });

  it('applies a fixed amount', async () => {
    const ctx = await createContext();
    const coupon = await createCoupon({ discount_type: 'FIXED_AMOUNT', discount_value: '8.50' });

    const res = await createOrderViaApi(ctx, withCoupon(coupon));

    expect(res.status).toBe(201);
    expectTotals(res.body.data, { subtotal: 20, discount: 8.5, shipping: 5, total: 16.5 });
  });

  it('caps a fixed amount at the subtotal (shipping is still charged)', async () => {
    const ctx = await createContext();
    const coupon = await createCoupon({ discount_type: 'FIXED_AMOUNT', discount_value: '50.00' });

    const res = await createOrderViaApi(ctx, withCoupon(coupon));

    expect(res.status).toBe(201);
    expectTotals(res.body.data, { subtotal: 20, discount: 20, shipping: 5, total: 5 });
  });

  it('uses the subtotal of all lines, not the client', async () => {
    const ctx = await createContext({ product: { price: '10.00', stock: 10 } });
    const other = await createProduct({ price: '7.50', stock: 10 });
    const coupon = await createCoupon({ discount_value: '20.00' });

    const res = await createOrderViaApi(ctx, {
      items: [
        { product_id: ctx.product.id, quantity: 2 },
        { product_id: other.id, quantity: 2 },
      ],
      subtotal: '1.00',
      discount_amount: '999.00',
      ...withCoupon(coupon),
    });

    // 20 + 15 = 35, 20% = 7
    expect(res.status).toBe(201);
    expectTotals(res.body.data, { subtotal: 35, discount: 7, shipping: 5, total: 33 });
  });

  it('treats an empty or null coupon_code as no coupon', async () => {
    const ctx = await createContext({ product: { stock: 10 } });

    for (const coupon_code of ['', '   ', null]) {
      const res = await createOrderViaApi(ctx, { coupon_code });
      expect(res.status).toBe(201);
      expect(res.body.data.coupon_id).toBeNull();
      expectTotals(res.body.data, { subtotal: 20, discount: 0, shipping: 5, total: 25 });
    }
  });

  it('rejects a coupon_code that is not a string', async () => {
    const ctx = await createContext();

    const res = await createOrderViaApi(ctx, { coupon_code: 123 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.map((d) => d.message)).toContain('Código de cupón inválido');
  });

  it('keeps an order without coupon unchanged (PRESERVE: points still work)', async () => {
    const ctx = await createContext({ points: 1000 });

    const res = await createOrderViaApi(ctx, { redeem_points: 500 });

    expect(res.status).toBe(201);
    expect(res.body.data.coupon_id).toBeNull();
    expectTotals(res.body.data, { subtotal: 20, discount: 5, shipping: 5, total: 20 });
    expect((await prisma.user.findUnique({ where: { id: ctx.user.id } })).loyalty_points).toBe(500);
  });
});

describe('POST /api/orders with coupon_code - rules (S5)', () => {
  const expectUntouched = async (ctx, coupon, before) => {
    expect(await snapshotOf(ctx)).toEqual(before);
    expect(await timesUsed(coupon.id)).toBe(coupon.times_used);
  };

  it.each([
    ['inactive', { is_active: false }],
    ['not started', () => ({ starts_at: new Date(Date.now() + DAY), expires_at: new Date(Date.now() + 2 * DAY) })],
    ['expired', () => ({ starts_at: new Date(Date.now() - 2 * DAY), expires_at: new Date(Date.now() - DAY) })],
  ])('rejects a %s coupon with the same message and changes nothing', async (_name, overrides) => {
    const ctx = await createContext();
    const coupon = await createCoupon(typeof overrides === 'function' ? overrides() : overrides);
    const before = await snapshotOf(ctx);

    const res = await createOrderViaApi(ctx, withCoupon(coupon));

    expectRejected(res, 'COUPON_INVALID', INVALID);
    await expectUntouched(ctx, coupon, before);
  });

  it('rejects an unknown code with the same message', async () => {
    const ctx = await createContext();
    const before = await snapshotOf(ctx);

    const res = await createOrderViaApi(ctx, { coupon_code: 'NO-EXISTE-XYZ' });

    expectRejected(res, 'COUPON_INVALID', INVALID);
    expect(await snapshotOf(ctx)).toEqual(before);
  });

  // Deliberate change (password-page-free-shipping S3): FREE_SHIPPING used to be rejected with
  // 'Este tipo de cupón todavía no está disponible en el checkout'; it is now applied to the shipping.
  // The full behavior is covered in coupons.free-shipping.test.js.
  it('accepts a FREE_SHIPPING coupon: it discounts the shipping and never the subtotal', async () => {
    const ctx = await createContext();
    const coupon = await createCoupon({ discount_type: 'FREE_SHIPPING', discount_value: '0.00' });

    const res = await createOrderViaApi(ctx, withCoupon(coupon));

    expect(res.status).toBe(201);
    expectTotals(res.body.data, { subtotal: 20, discount: 5, shipping: 5, total: 20 });
    expect(res.body.data.coupon_id).toBe(coupon.id);
    expect(await timesUsed(coupon.id)).toBe(1);
  });

  it('enforces the minimum purchase on the subtotal, not on subtotal + shipping', async () => {
    const ctx = await createContext();
    const coupon = await createCoupon({ minimum_purchase_amount: '22.00' });
    const before = await snapshotOf(ctx);

    const res = await createOrderViaApi(ctx, withCoupon(coupon));

    expectRejected(res, 'COUPON_MIN_PURCHASE', 'El cupón requiere una compra mínima de Bs. 22.00');
    await expectUntouched(ctx, coupon, before);
  });

  it('accepts a subtotal equal to the minimum purchase', async () => {
    const ctx = await createContext();
    const coupon = await createCoupon({ minimum_purchase_amount: '20.00' });

    const res = await createOrderViaApi(ctx, withCoupon(coupon));

    expect(res.status).toBe(201);
    expect(Number(res.body.data.discount_amount)).toBe(2);
  });

  it('enforces usage_limit_total across customers and changes nothing when reached', async () => {
    const coupon = await createCoupon({ usage_limit_total: 1 });
    const first = await createContext();
    const second = await createContext();

    const ok = await createOrderViaApi(first, withCoupon(coupon));
    const before = await snapshotOf(second);
    const res = await createOrderViaApi(second, withCoupon(coupon));

    expect(ok.status).toBe(201);
    expectRejected(res, 'COUPON_LIMIT_REACHED', TOTAL_LIMIT);
    expect(await snapshotOf(second)).toEqual(before);
    expect(await timesUsed(coupon.id)).toBe(1);
  });

  it('never exceeds usage_limit_total under concurrent orders for the last use', async () => {
    const coupon = await createCoupon({ usage_limit_total: 2 });
    const product = await createProduct({ stock: 20 });
    const method = await createShippingMethod();
    const buyers = await Promise.all(
      Array.from({ length: 6 }, async () => {
        const { user, token } = await createUser();
        return { user, token, address: await createAddress(user.id) };
      })
    );

    const responses = await Promise.all(
      buyers.map((b) =>
        api.post('/api/orders', b.token, {
          items: [{ product_id: product.id, quantity: 1 }],
          shipping_address_id: b.address.id,
          shipping_method_id: method.id,
          payment_method: 'CASH_ON_DELIVERY',
          coupon_code: coupon.code,
        })
      )
    );

    expect(responses.filter((r) => r.status === 201)).toHaveLength(2);
    for (const r of responses.filter((r) => r.status !== 201)) {
      expectRejected(r, 'COUPON_LIMIT_REACHED', TOTAL_LIMIT);
    }
    expect(await timesUsed(coupon.id)).toBe(2);
    expect(await prisma.order.count({ where: { coupon_id: coupon.id } })).toBe(2);
    // rejected orders rolled their stock back
    expect((await prisma.product.findUnique({ where: { id: product.id } })).stock).toBe(18);
  });

  it('enforces usage_limit_per_user and does not affect other customers', async () => {
    const coupon = await createCoupon({ usage_limit_per_user: 1 });
    const ctx = await createContext({ product: { stock: 20 } });
    const other = await createContext();

    const first = await createOrderViaApi(ctx, withCoupon(coupon));
    const before = await snapshotOf(ctx);
    const second = await createOrderViaApi(ctx, withCoupon(coupon));
    const otherCustomer = await createOrderViaApi(other, withCoupon(coupon));

    expect(first.status).toBe(201);
    expectRejected(second, 'COUPON_USER_LIMIT', USER_LIMIT);
    expect(await snapshotOf(ctx)).toEqual(before);
    expect(otherCustomer.status).toBe(201);
    expect(await timesUsed(coupon.id)).toBe(2);
  });

  it('does not count cancelled orders towards usage_limit_per_user', async () => {
    const coupon = await createCoupon({ usage_limit_per_user: 1 });
    const ctx = await createContext({ product: { stock: 20 } });
    const first = await createOrderViaApi(ctx, withCoupon(coupon));
    await api.post(`/api/orders/${first.body.data.order_number}/cancel`, ctx.token, { reason: 'Cambio de opinión' });

    const again = await createOrderViaApi(ctx, withCoupon(coupon));

    expect(again.status).toBe(201);
    expect(await timesUsed(coupon.id)).toBe(1);
  });

  it('never exceeds usage_limit_per_user when the same customer orders concurrently', async () => {
    const coupon = await createCoupon({ usage_limit_per_user: 1 });
    const ctx = await createContext({ product: { stock: 20 } });

    const responses = await Promise.all(Array.from({ length: 5 }, () => createOrderViaApi(ctx, withCoupon(coupon))));

    expect(responses.filter((r) => r.status === 201)).toHaveLength(1);
    for (const r of responses.filter((r) => r.status !== 201)) {
      expectRejected(r, 'COUPON_USER_LIMIT', USER_LIMIT);
    }
    expect(await prisma.order.count({ where: { coupon_id: coupon.id } })).toBe(1);
    expect(await timesUsed(coupon.id)).toBe(1);
    expect((await prisma.product.findUnique({ where: { id: ctx.product.id } })).stock).toBe(18);
  });

  it('rejects a coupon together with points and changes nothing', async () => {
    const ctx = await createContext({ points: 1000 });
    const coupon = await createCoupon();
    const before = await snapshotOf(ctx);

    const res = await createOrderViaApi(ctx, withCoupon(coupon, { redeem_points: 100 }));

    expectRejected(res, 'COUPON_POINTS_CONFLICT', NOT_BOTH);
    await expectUntouched(ctx, coupon, before);
  });

  it('accepts a coupon with redeem_points 0 or omitted', async () => {
    const ctx = await createContext({ points: 1000, product: { stock: 20 } });
    const coupon = await createCoupon();

    const res = await createOrderViaApi(ctx, withCoupon(coupon, { redeem_points: 0 }));

    expect(res.status).toBe(201);
    expect((await prisma.user.findUnique({ where: { id: ctx.user.id } })).loyalty_points).toBe(1000);
  });

  it('rejects the coupon + points conflict even when the coupon would not be valid', async () => {
    const ctx = await createContext({ points: 1000 });

    const res = await createOrderViaApi(ctx, { coupon_code: 'NO-EXISTE-XYZ', redeem_points: 100 });

    expectRejected(res, 'COUPON_POINTS_CONFLICT', NOT_BOTH);
  });
});
