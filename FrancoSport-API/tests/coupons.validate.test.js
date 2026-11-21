import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { prisma, createContext, createProduct, createVariant, createOrderViaApi, snapshotOf } from './helpers.js';
import { createCouponRoutes } from '../src/routes/coupon.routes.js';
import { createRateLimiters } from '../src/middleware/rateLimits.js';
import { errorHandler } from '../src/middleware/errorHandler.js';

// Mounted here until the parent adds `app.use('/api/coupons', createCouponRoutes(limiters))` to app.js
const app = express();
app.use(express.json());
app.use('/api/coupons', createCouponRoutes(createRateLimiters({ enabled: false })));
app.use(errorHandler);

const validate = (token, body) => {
  const req = request(app).post('/api/coupons/validate');
  if (token) req.set('Authorization', `Bearer ${token}`);
  return req.send(body);
};

const DAY = 24 * 60 * 60 * 1000;
let codeCounter = 0;

const createCoupon = (overrides = {}) =>
  prisma.coupon.create({
    data: {
      code: `VL${Date.now().toString(36)}${(codeCounter++).toString(36)}`.toUpperCase(),
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

describe('POST /api/coupons/validate (S5)', () => {
  it('requires authentication', async () => {
    const res = await validate(null, { code: 'X', items: [] });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns exactly the discount the order is charged, computed from the cart items sent', async () => {
    const ctx = await createContext({ product: { price: '11.11', stock: 10 } });
    const variant = await createVariant(ctx.product.id, { price: '4.25', stock: 5 });
    const coupon = await createCoupon({ discount_value: '15.00', maximum_discount_amount: '5.00' });
    const items = [
      { product_id: ctx.product.id, quantity: 3 },
      { product_id: ctx.product.id, variant_id: variant.id, quantity: 2 },
    ];

    // The client also sends a made-up subtotal and price, which are never trusted
    const res = await validate(ctx.token, { code: coupon.code.toLowerCase(), items, subtotal: 1, cart_subtotal: 1 });
    const order = await createOrderViaApi(ctx, { items, coupon_code: coupon.code });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.code).toBe(coupon.code);
    expect(res.body.data.discount_type).toBe('PERCENTAGE');
    expect(res.body.data.subtotal).toBe('41.83');
    expect(res.body.data.discount_amount).toBe('5.00');
    expect(order.status).toBe(201);
    expect(Number(order.body.data.subtotal)).toBe(Number(res.body.data.subtotal));
    expect(Number(order.body.data.discount_amount)).toBe(Number(res.body.data.discount_amount));
  });

  it('matches the charged discount for a fixed amount and the subtotal cap', async () => {
    const ctx = await createContext({ product: { price: '10.00', stock: 10 } });
    const coupon = await createCoupon({ discount_type: 'FIXED_AMOUNT', discount_value: '50.00' });
    const items = [{ product_id: ctx.product.id, quantity: 2 }];

    const res = await validate(ctx.token, { code: coupon.code, items });
    const order = await createOrderViaApi(ctx, { items, coupon_code: coupon.code });

    expect(res.body.data.discount_amount).toBe('20.00');
    expect(Number(order.body.data.discount_amount)).toBe(20);
  });

  it('does not take a use', async () => {
    const ctx = await createContext();
    const coupon = await createCoupon({ usage_limit_total: 1 });
    const before = await snapshotOf(ctx);

    const res = await validate(ctx.token, { code: coupon.code, items: [{ product_id: ctx.product.id, quantity: 1 }] });

    expect(res.status).toBe(200);
    expect(await timesUsed(coupon.id)).toBe(0);
    expect(await snapshotOf(ctx)).toEqual(before);
  });

  it("uses the customer's server-side cart when no items are sent", async () => {
    const ctx = await createContext({ product: { price: '10.00', stock: 10 } });
    const coupon = await createCoupon({ discount_value: '10.00' });
    await prisma.cart.create({
      data: { user_id: ctx.user.id, items: { create: [{ product_id: ctx.product.id, quantity: 3, price_at_add: '1.00' }] } },
    });

    const res = await validate(ctx.token, { code: coupon.code });

    // price_at_add is stale data: the current database price counts
    expect(res.status).toBe(200);
    expect(res.body.data.subtotal).toBe('30.00');
    expect(res.body.data.discount_amount).toBe('3.00');
  });

  it('rejects an empty cart', async () => {
    const ctx = await createContext();
    const coupon = await createCoupon();

    const res = await validate(ctx.token, { code: coupon.code });

    expectRejected(res, 'EMPTY_CART', 'Su carrito está vacío');
  });

  it('applies the same server rules and messages as order creation', async () => {
    const ctx = await createContext();
    const items = [{ product_id: ctx.product.id, quantity: 2 }];
    const expired = await createCoupon({ expires_at: new Date(Date.now() - DAY) });
    const inactive = await createCoupon({ is_active: false });
    const minimum = await createCoupon({ minimum_purchase_amount: '25.00' });
    const exhausted = await createCoupon({ usage_limit_total: 1, times_used: 1 });
    const perUser = await createCoupon({ usage_limit_per_user: 1 });
    // the customer under test uses it once
    const own = await createOrderViaApi(ctx, { coupon_code: perUser.code });
    expect(own.status).toBe(201);

    const cases = [
      [{ code: 'NO-EXISTE-XYZ' }, 'COUPON_INVALID', 'Cupón no válido o vencido'],
      [{ code: expired.code }, 'COUPON_INVALID', 'Cupón no válido o vencido'],
      [{ code: inactive.code }, 'COUPON_INVALID', 'Cupón no válido o vencido'],
      [{ code: minimum.code }, 'COUPON_MIN_PURCHASE', 'El cupón requiere una compra mínima de Bs. 25.00'],
      [{ code: exhausted.code }, 'COUPON_LIMIT_REACHED', 'Este cupón ya alcanzó su límite de usos'],
      [{ code: perUser.code }, 'COUPON_USER_LIMIT', 'Ya usó este cupón el máximo de veces permitido'],
    ];
    for (const [body, code, message] of cases) {
      expectRejected(await validate(ctx.token, { ...body, items }), code, message);
    }
  });

  it('validates the body', async () => {
    const ctx = await createContext();
    const product = await createProduct();

    for (const body of [
      {},
      { code: '' },
      { code: 5 },
      { code: 'A'.repeat(51) },
      { code: 'X', items: [] },
      { code: 'X', items: [{ product_id: product.id, quantity: 0 }] },
      { code: 'X', items: [{ product_id: product.id, quantity: 1.5 }] },
      { code: 'X', items: 'nope' },
    ]) {
      const res = await validate(ctx.token, body);
      expect(res.status, JSON.stringify(body)).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('rejects unknown or inactive products in the items like order creation', async () => {
    const ctx = await createContext();
    const coupon = await createCoupon();
    const inactive = await createProduct({ is_active: false });

    const missing = await validate(ctx.token, { code: coupon.code, items: [{ product_id: 99999999, quantity: 1 }] });
    const off = await validate(ctx.token, { code: coupon.code, items: [{ product_id: inactive.id, quantity: 1 }] });

    expectRejected(missing, 'INVALID_ORDER', 'Producto no encontrado: 99999999');
    expectRejected(off, 'INVALID_ORDER', `El producto ${inactive.name} no está disponible`);
  });
});
