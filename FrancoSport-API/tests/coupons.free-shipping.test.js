import { describe, it, expect } from 'vitest';
import { api, prisma, createContext, createUser, createOrderViaApi, snapshotOf } from './helpers.js';

const DAY = 24 * 60 * 60 * 1000;
let codeCounter = 0;

/** A valid FREE_SHIPPING coupon (valid from yesterday to tomorrow) with any field overridden */
const createCoupon = (overrides = {}) =>
  prisma.coupon.create({
    data: {
      code: `FS${Date.now().toString(36)}${(codeCounter++).toString(36)}`.toUpperCase(),
      description: 'Envío gratis de prueba',
      discount_type: 'FREE_SHIPPING',
      discount_value: '0.00',
      starts_at: new Date(Date.now() - DAY),
      expires_at: new Date(Date.now() + DAY),
      is_active: true,
      ...overrides,
    },
  });

const timesUsed = async (id) => (await prisma.coupon.findUnique({ where: { id } })).times_used;

// product 10.00 x 2 = subtotal 20.00; weight 0.75 x 2 = 1.5 kg; shipping 5.00 + 2.50 x 1.5 = 8.75
const shippingContext = (options = {}) =>
  createContext({ product: { price: '10.00', stock: 10, weight: '0.75' }, method: { base_cost: '5.00', cost_per_kg: '2.50' }, ...options });

const validate = (token, body) => api.post('/api/coupons/validate', token, body);

const expectRejected = (res, code, message) => {
  expect(res.status).toBe(400);
  expect(res.body).toEqual({ success: false, error: { code, message } });
};

const expectTotals = (order, { subtotal, discount, shipping, total }) => {
  expect(Number(order.subtotal)).toBe(subtotal);
  expect(Number(order.discount_amount)).toBe(discount);
  expect(Number(order.shipping_cost)).toBe(shipping);
  expect(Number(order.total_amount)).toBe(total);
};

const statusPath = (order) => `/api/admin/orders/${order.order_number}/status`;

describe('POST /api/orders with a FREE_SHIPPING coupon (S3)', () => {
  it('discounts the whole shipping cost, leaves the subtotal untouched and stores coupon and discount', async () => {
    const ctx = await shippingContext();
    const coupon = await createCoupon();

    const res = await createOrderViaApi(ctx, { coupon_code: coupon.code });

    expect(res.status).toBe(201);
    expectTotals(res.body.data, { subtotal: 20, discount: 8.75, shipping: 8.75, total: 20 });
    expect(res.body.data.coupon_id).toBe(coupon.id);
    const stored = await prisma.order.findUnique({ where: { id: res.body.data.id } });
    expect(stored.discount_amount.toFixed(2)).toBe('8.75');
    expect(stored.shipping_cost.toFixed(2)).toBe('8.75');
    expect(stored.total_amount.toFixed(2)).toBe('20.00');
    expect(await timesUsed(coupon.id)).toBe(1);
    const items = await prisma.orderItem.findMany({ where: { order_id: stored.id } });
    expect(items.map((item) => item.subtotal.toFixed(2))).toEqual(['20.00']);
    expect(items.map((item) => item.price_at_purchase.toFixed(2))).toEqual(['10.00']);
  });

  it('is capped by maximum_discount_amount, and the customer pays the rest of the shipping', async () => {
    const ctx = await shippingContext();
    const coupon = await createCoupon({ maximum_discount_amount: '3.00' });

    const res = await createOrderViaApi(ctx, { coupon_code: coupon.code });

    expect(res.status).toBe(201);
    expectTotals(res.body.data, { subtotal: 20, discount: 3, shipping: 8.75, total: 25.75 });
  });

  it('a cap above the shipping cost never discounts more than the shipping', async () => {
    const ctx = await shippingContext();
    const coupon = await createCoupon({ maximum_discount_amount: '50.00' });

    const res = await createOrderViaApi(ctx, { coupon_code: coupon.code });

    expect(res.status).toBe(201);
    expectTotals(res.body.data, { subtotal: 20, discount: 8.75, shipping: 8.75, total: 20 });
  });

  it('a shipping cost of 0 gives a discount of 0 (the use is still taken)', async () => {
    const ctx = await createContext({ method: { base_cost: '0.00', cost_per_kg: '0.00' } });
    const coupon = await createCoupon();

    const res = await createOrderViaApi(ctx, { coupon_code: coupon.code });

    expect(res.status).toBe(201);
    expectTotals(res.body.data, { subtotal: 20, discount: 0, shipping: 0, total: 20 });
    expect(await timesUsed(coupon.id)).toBe(1);
  });

  it('ignores discount_value (only the shipping counts)', async () => {
    const ctx = await shippingContext();
    const coupon = await createCoupon({ discount_value: '99.00' });

    const res = await createOrderViaApi(ctx, { coupon_code: coupon.code });

    expectTotals(res.body.data, { subtotal: 20, discount: 8.75, shipping: 8.75, total: 20 });
  });

  it('enforces the minimum purchase on the subtotal and changes nothing', async () => {
    const ctx = await shippingContext();
    const coupon = await createCoupon({ minimum_purchase_amount: '25.00' });
    const before = await snapshotOf(ctx);

    const res = await createOrderViaApi(ctx, { coupon_code: coupon.code });

    expectRejected(res, 'COUPON_MIN_PURCHASE', 'El cupón requiere una compra mínima de Bs. 25.00');
    expect(await snapshotOf(ctx)).toEqual(before);
    expect(await timesUsed(coupon.id)).toBe(0);
  });

  it('rejects expired and inactive coupons with the usual message', async () => {
    const ctx = await shippingContext();
    const expired = await createCoupon({ expires_at: new Date(Date.now() - DAY) });
    const inactive = await createCoupon({ is_active: false });

    for (const coupon of [expired, inactive]) {
      expectRejected(await createOrderViaApi(ctx, { coupon_code: coupon.code }), 'COUPON_INVALID', 'Cupón no válido o vencido');
    }
  });

  it('enforces the total limit and the per-customer limit', async () => {
    const ctx = await shippingContext();
    const other = await shippingContext();
    const total = await createCoupon({ usage_limit_total: 1 });
    const perUser = await createCoupon({ usage_limit_per_user: 1 });

    expect((await createOrderViaApi(ctx, { coupon_code: total.code })).status).toBe(201);
    expectRejected(
      await createOrderViaApi(other, { coupon_code: total.code }),
      'COUPON_LIMIT_REACHED',
      'Este cupón ya alcanzó su límite de usos'
    );
    expect((await createOrderViaApi(ctx, { coupon_code: perUser.code })).status).toBe(201);
    const before = await snapshotOf(ctx);
    expectRejected(
      await createOrderViaApi(ctx, { coupon_code: perUser.code }),
      'COUPON_USER_LIMIT',
      'Ya usó este cupón el máximo de veces permitido'
    );
    expect(await snapshotOf(ctx)).toEqual(before);
    expect(await timesUsed(total.id)).toBe(1);
    expect(await timesUsed(perUser.id)).toBe(1);
  });

  it('is rejected together with points and changes nothing', async () => {
    const ctx = await shippingContext({ points: 500 });
    const coupon = await createCoupon();
    const before = await snapshotOf(ctx);

    const res = await createOrderViaApi(ctx, { coupon_code: coupon.code, redeem_points: 100 });

    expectRejected(res, 'COUPON_POINTS_CONFLICT', 'Puede usar un cupón o sus puntos, no ambos');
    expect(await snapshotOf(ctx)).toEqual(before);
    expect(await timesUsed(coupon.id)).toBe(0);
  });
});

describe('cancelling and reopening an order with a FREE_SHIPPING coupon (S3)', () => {
  const place = async (couponOverrides) => {
    const ctx = await shippingContext();
    const coupon = await createCoupon(couponOverrides);
    const res = await createOrderViaApi(ctx, { coupon_code: coupon.code });
    expect(res.status).toBe(201);
    return { ctx, coupon, order: res.body.data, admin: await createUser({ role: 'ADMIN' }) };
  };

  it('cancelling releases the use once; reopening takes it again and keeps the stored amounts', async () => {
    const placed = await place({ usage_limit_total: 1 });

    const cancel = await api.post(`/api/orders/${placed.order.order_number}/cancel`, placed.ctx.token, { reason: 'Ya no lo quiero' });
    const again = await api.post(`/api/orders/${placed.order.order_number}/cancel`, placed.ctx.token, { reason: 'Ya no lo quiero' });
    expect(cancel.status).toBe(200);
    expect(again.status).toBe(400);
    expect(await timesUsed(placed.coupon.id)).toBe(0);

    const reopen = await api.patch(statusPath(placed.order), placed.admin.token, { status: 'PENDING' });

    expect(reopen.status).toBe(200);
    expect(await timesUsed(placed.coupon.id)).toBe(1);
    const stored = await prisma.order.findUnique({ where: { id: placed.order.id } });
    expect(stored.status).toBe('PENDING');
    expect(stored.discount_amount.toFixed(2)).toBe('8.75');
    expect(stored.total_amount.toFixed(2)).toBe('20.00');
  });

  it('reopening fails clearly, changing nothing, when the coupon expired meanwhile', async () => {
    const placed = await place();
    await api.post(`/api/orders/${placed.order.order_number}/cancel`, placed.ctx.token, { reason: 'Ya no lo quiero' });
    await prisma.coupon.update({ where: { id: placed.coupon.id }, data: { expires_at: new Date(Date.now() - DAY) } });

    const res = await api.patch(statusPath(placed.order), placed.admin.token, { status: 'PENDING' });

    expectRejected(
      res,
      'CANNOT_REOPEN',
      `No se puede reabrir el pedido: el cupón ${placed.coupon.code} ya no es válido o venció`
    );
    expect((await prisma.order.findUnique({ where: { id: placed.order.id } })).status).toBe('CANCELLED');
    expect(await timesUsed(placed.coupon.id)).toBe(0);
  });

  it('reopening fails when another order took the last use', async () => {
    const placed = await place({ usage_limit_total: 1 });
    await api.post(`/api/orders/${placed.order.order_number}/cancel`, placed.ctx.token, { reason: 'Ya no lo quiero' });
    const other = await shippingContext();
    expect((await createOrderViaApi(other, { coupon_code: placed.coupon.code })).status).toBe(201);

    const res = await api.patch(statusPath(placed.order), placed.admin.token, { status: 'PENDING' });

    expectRejected(
      res,
      'CANNOT_REOPEN',
      `No se puede reabrir el pedido: el cupón ${placed.coupon.code} alcanzó su límite de usos`
    );
    expect(await timesUsed(placed.coupon.id)).toBe(1);
  });
});

describe('POST /api/coupons/validate with a FREE_SHIPPING coupon (S3)', () => {
  const items = (ctx) => [{ product_id: ctx.product.id, quantity: 2 }];

  it('returns the shipping discount for shipping_method_id, equal to what the order is charged', async () => {
    const ctx = await shippingContext();
    const coupon = await createCoupon();

    const res = await validate(ctx.token, { code: coupon.code, items: items(ctx), shipping_method_id: ctx.method.id });
    const order = await createOrderViaApi(ctx, { coupon_code: coupon.code });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      code: coupon.code,
      discount_type: 'FREE_SHIPPING',
      subtotal: '20.00',
      shipping_cost: '8.75',
      discount_amount: '8.75',
      applies_to: 'SHIPPING',
    });
    expect(order.status).toBe(201);
    expect(Number(order.body.data.discount_amount)).toBe(Number(res.body.data.discount_amount));
    expect(Number(order.body.data.shipping_cost)).toBe(Number(res.body.data.shipping_cost));
  });

  it('is capped by maximum_discount_amount like the order', async () => {
    const ctx = await shippingContext();
    const coupon = await createCoupon({ maximum_discount_amount: '3.00' });

    const res = await validate(ctx.token, { code: coupon.code, items: items(ctx), shipping_method_id: ctx.method.id });
    const order = await createOrderViaApi(ctx, { coupon_code: coupon.code });

    expect(res.body.data.discount_amount).toBe('3.00');
    expect(Number(order.body.data.discount_amount)).toBe(3);
  });

  it('uses the server-side cart when no items are sent', async () => {
    const ctx = await shippingContext();
    const coupon = await createCoupon();
    await prisma.cart.create({
      data: { user_id: ctx.user.id, items: { create: [{ product_id: ctx.product.id, quantity: 2, price_at_add: '1.00' }] } },
    });

    const res = await validate(ctx.token, { code: coupon.code, shipping_method_id: ctx.method.id });

    expect(res.status).toBe(200);
    expect(res.body.data.discount_amount).toBe('8.75');
  });

  it('asks for the shipping method when it is missing, and takes no use', async () => {
    const ctx = await shippingContext();
    const coupon = await createCoupon();

    const res = await validate(ctx.token, { code: coupon.code, items: items(ctx) });

    expectRejected(res, 'SHIPPING_METHOD_REQUIRED', 'Seleccione un método de envío para aplicar este cupón');
    expect(await timesUsed(coupon.id)).toBe(0);
  });

  it('rejects an unavailable or invalid shipping method like order creation', async () => {
    const ctx = await shippingContext();
    const coupon = await createCoupon();
    const inactive = (await createContext({ method: { is_active: false } })).method;

    expectRejected(
      await validate(ctx.token, { code: coupon.code, items: items(ctx), shipping_method_id: inactive.id }),
      'INVALID_ORDER',
      'Método de envío no disponible'
    );
    expectRejected(
      await validate(ctx.token, { code: coupon.code, items: items(ctx), shipping_method_id: 99999999 }),
      'INVALID_ORDER',
      'Método de envío no disponible'
    );
    const bad = await validate(ctx.token, { code: coupon.code, items: items(ctx), shipping_method_id: 'x' });
    expect(bad.status).toBe(400);
    expect(bad.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('applies the same coupon rules (minimum purchase, limits)', async () => {
    const ctx = await shippingContext();
    const minimum = await createCoupon({ minimum_purchase_amount: '25.00' });
    const exhausted = await createCoupon({ usage_limit_total: 1, times_used: 1 });
    const body = (coupon) => ({ code: coupon.code, items: items(ctx), shipping_method_id: ctx.method.id });

    expectRejected(await validate(ctx.token, body(minimum)), 'COUPON_MIN_PURCHASE', 'El cupón requiere una compra mínima de Bs. 25.00');
    expectRejected(await validate(ctx.token, body(exhausted)), 'COUPON_LIMIT_REACHED', 'Este cupón ya alcanzó su límite de usos');
  });

  it('PRESERVE: a percentage coupon needs no shipping method and ignores one when sent', async () => {
    const ctx = await shippingContext();
    const coupon = await createCoupon({ discount_type: 'PERCENTAGE', discount_value: '10.00' });

    const without = await validate(ctx.token, { code: coupon.code, items: items(ctx) });
    const withMethod = await validate(ctx.token, { code: coupon.code, items: items(ctx), shipping_method_id: ctx.method.id });

    expect(without.status).toBe(200);
    expect(without.body.data.discount_amount).toBe('2.00');
    expect(without.body.data.applies_to).toBe('SUBTOTAL');
    expect(withMethod.status).toBe(200);
    expect(withMethod.body.data.discount_amount).toBe('2.00');
  });
});

describe('PRESERVE: percentage and fixed coupons never touch the shipping (S3)', () => {
  it('still discounts only the subtotal', async () => {
    const ctx = await shippingContext();
    const percentage = await createCoupon({ discount_type: 'PERCENTAGE', discount_value: '10.00' });
    const fixed = await createCoupon({ discount_type: 'FIXED_AMOUNT', discount_value: '50.00' });

    const a = await createOrderViaApi(ctx, { coupon_code: percentage.code });
    const b = await createOrderViaApi(ctx, { coupon_code: fixed.code });

    expectTotals(a.body.data, { subtotal: 20, discount: 2, shipping: 8.75, total: 26.75 });
    expectTotals(b.body.data, { subtotal: 20, discount: 20, shipping: 8.75, total: 8.75 });
  });
});
