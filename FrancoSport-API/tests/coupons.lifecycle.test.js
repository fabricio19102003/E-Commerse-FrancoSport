import { describe, it, expect } from 'vitest';
import { api, prisma, createContext, createUser, createOrderViaApi } from './helpers.js';

const DAY = 24 * 60 * 60 * 1000;
let codeCounter = 0;

const createCoupon = (overrides = {}) =>
  prisma.coupon.create({
    data: {
      code: `LC${Date.now().toString(36)}${(codeCounter++).toString(36)}`.toUpperCase(),
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
const stockOf = async (id) => (await prisma.product.findUnique({ where: { id } })).stock;

// An order with a coupon placed through the real API (product stock 10 -> 8)
const placeOrder = async (couponOverrides = {}, ctxOptions = {}) => {
  const ctx = await createContext({ product: { stock: 10 }, ...ctxOptions });
  const coupon = await createCoupon(couponOverrides);
  const res = await createOrderViaApi(ctx, { coupon_code: coupon.code });
  expect(res.status).toBe(201);
  expect(await timesUsed(coupon.id)).toBe(1);
  return { ctx, coupon, order: res.body.data };
};

const cancelByCustomer = ({ ctx, order }) =>
  api.post(`/api/orders/${order.order_number}/cancel`, ctx.token, { reason: 'Ya no lo quiero' });

const statusPath = (order) => `/api/admin/orders/${order.order_number}/status`;

describe('cancelling an order releases the coupon use exactly once (S5)', () => {
  it('customer cancellation decrements times_used once, even when repeated', async () => {
    const placed = await placeOrder();

    const first = await cancelByCustomer(placed);
    const second = await cancelByCustomer(placed);

    expect(first.status).toBe(200);
    expect(second.status).toBe(400);
    expect(await timesUsed(placed.coupon.id)).toBe(0);
    // the order keeps the coupon and the discount it was sold with
    const stored = await prisma.order.findUnique({ where: { id: placed.order.id } });
    expect(stored.coupon_id).toBe(placed.coupon.id);
    expect(Number(stored.discount_amount)).toBe(2);
  });

  it('releases only the cancelled order use when the coupon has several', async () => {
    const coupon = await createCoupon();
    const a = await createContext();
    const b = await createContext();
    const orderA = (await createOrderViaApi(a, { coupon_code: coupon.code })).body.data;
    await createOrderViaApi(b, { coupon_code: coupon.code });

    await api.post(`/api/orders/${orderA.order_number}/cancel`, a.token, { reason: 'Uno' });

    expect(await timesUsed(coupon.id)).toBe(1);
  });

  it('admin status change to CANCELLED decrements once, even with a later customer or admin cancel', async () => {
    const placed = await placeOrder();
    const admin = await createUser({ role: 'ADMIN' });

    const viaStatus = await api.patch(statusPath(placed.order), admin.token, { status: 'CANCELLED' });
    const again = await api.patch(statusPath(placed.order), admin.token, { status: 'CANCELLED' });
    const viaCustomer = await cancelByCustomer(placed);
    const viaCancel = await api.post(`/api/admin/orders/${placed.order.order_number}/cancel`, admin.token, { reason: 'x' });

    expect(viaStatus.status).toBe(200);
    expect(again.status).toBe(400);
    expect(viaCustomer.status).toBe(400);
    expect(viaCancel.status).toBe(400);
    expect(await timesUsed(placed.coupon.id)).toBe(0);
  });

  it('admin cancel route decrements once', async () => {
    const placed = await placeOrder();
    const admin = await createUser({ role: 'ADMIN' });
    const path = `/api/admin/orders/${placed.order.order_number}/cancel`;

    await api.post(path, admin.token, { reason: 'Sin stock real' });
    await api.post(path, admin.token, { reason: 'Sin stock real' });

    expect(await timesUsed(placed.coupon.id)).toBe(0);
  });

  it('concurrent cancellations decrement once', async () => {
    const placed = await placeOrder();

    await Promise.all(Array.from({ length: 4 }, () => cancelByCustomer(placed)));

    expect(await timesUsed(placed.coupon.id)).toBe(0);
  });

  it('never takes times_used below zero', async () => {
    const placed = await placeOrder();
    await prisma.coupon.update({ where: { id: placed.coupon.id }, data: { times_used: 0 } });

    await cancelByCustomer(placed);

    expect(await timesUsed(placed.coupon.id)).toBe(0);
  });

  it('cancelling an order without a coupon touches no coupon (PRESERVE)', async () => {
    const coupon = await createCoupon({ times_used: 3 });
    const ctx = await createContext();
    const created = await createOrderViaApi(ctx);

    const res = await api.post(`/api/orders/${created.body.data.order_number}/cancel`, ctx.token, { reason: 'x' });

    expect(res.status).toBe(200);
    expect(await timesUsed(coupon.id)).toBe(3);
  });
});

describe('reopening a cancelled order takes the coupon use again or fails unchanged (S5)', () => {
  const cancelled = async (couponOverrides, ctxOptions) => {
    const placed = await placeOrder(couponOverrides, ctxOptions);
    await cancelByCustomer(placed);
    expect(await timesUsed(placed.coupon.id)).toBe(0);
    expect(await stockOf(placed.ctx.product.id)).toBe(10);
    return { ...placed, admin: await createUser({ role: 'ADMIN' }) };
  };

  const expectStillCancelled = async (placed, message) => {
    const res = placed.res;
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ success: false, error: { code: 'CANNOT_REOPEN', message } });
    const order = await prisma.order.findUnique({ where: { id: placed.order.id } });
    expect(order.status).toBe('CANCELLED');
    expect(await stockOf(placed.ctx.product.id)).toBe(10);
    expect(await timesUsed(placed.coupon.id)).toBe(placed.expectedUsed);
  };

  it('retakes the use, and repeating the request takes nothing more', async () => {
    const placed = await cancelled({ usage_limit_total: 1 });

    const first = await api.patch(statusPath(placed.order), placed.admin.token, { status: 'PENDING' });
    const second = await api.patch(statusPath(placed.order), placed.admin.token, { status: 'PENDING' });

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect((await prisma.order.findUnique({ where: { id: placed.order.id } })).status).toBe('PENDING');
    expect(await timesUsed(placed.coupon.id)).toBe(1);
    expect(await stockOf(placed.ctx.product.id)).toBe(8);
    const stored = await prisma.order.findUnique({ where: { id: placed.order.id } });
    expect(Number(stored.discount_amount)).toBe(2);
    expect(Number(stored.total_amount)).toBe(23);
  });

  it('concurrent reopen requests take the use once', async () => {
    const placed = await cancelled();

    await Promise.all(
      Array.from({ length: 4 }, () => api.patch(statusPath(placed.order), placed.admin.token, { status: 'PENDING' }))
    );

    expect(await timesUsed(placed.coupon.id)).toBe(1);
    expect(await stockOf(placed.ctx.product.id)).toBe(8);
  });

  it('fails with a clear message and changes nothing when the coupon expired meanwhile', async () => {
    const placed = await cancelled();
    await prisma.coupon.update({ where: { id: placed.coupon.id }, data: { expires_at: new Date(Date.now() - DAY) } });

    const res = await api.patch(statusPath(placed.order), placed.admin.token, { status: 'PENDING' });

    await expectStillCancelled(
      { ...placed, res, expectedUsed: 0 },
      `No se puede reabrir el pedido: el cupón ${placed.coupon.code} ya no es válido o venció`
    );
  });

  it('fails when the coupon was deactivated meanwhile', async () => {
    const placed = await cancelled();
    await prisma.coupon.update({ where: { id: placed.coupon.id }, data: { is_active: false } });

    const res = await api.patch(statusPath(placed.order), placed.admin.token, { status: 'PENDING' });

    await expectStillCancelled(
      { ...placed, res, expectedUsed: 0 },
      `No se puede reabrir el pedido: el cupón ${placed.coupon.code} ya no es válido o venció`
    );
  });

  it('fails when another order took the last use of the coupon', async () => {
    const placed = await cancelled({ usage_limit_total: 1 });
    const other = await createContext();
    expect((await createOrderViaApi(other, { coupon_code: placed.coupon.code })).status).toBe(201);

    const res = await api.patch(statusPath(placed.order), placed.admin.token, { status: 'PENDING' });

    await expectStillCancelled(
      { ...placed, res, expectedUsed: 1 },
      `No se puede reabrir el pedido: el cupón ${placed.coupon.code} alcanzó su límite de usos`
    );
  });

  it('fails when the customer already used the coupon the permitted times on another order', async () => {
    const placed = await cancelled({ usage_limit_per_user: 1 }, { product: { stock: 10 } });
    // the same customer places a new order with the coupon (stock 10 -> 8), so reopening would be the second
    const again = await createOrderViaApi(placed.ctx, { coupon_code: placed.coupon.code });
    expect(again.status).toBe(201);

    const res = await api.patch(statusPath(placed.order), placed.admin.token, { status: 'PENDING' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      success: false,
      error: {
        code: 'CANNOT_REOPEN',
        message: `No se puede reabrir el pedido: el cliente ya usó el cupón ${placed.coupon.code} el máximo de veces permitido`,
      },
    });
    expect((await prisma.order.findUnique({ where: { id: placed.order.id } })).status).toBe('CANCELLED');
    expect(await stockOf(placed.ctx.product.id)).toBe(8);
    expect(await timesUsed(placed.coupon.id)).toBe(1);
  });

  it('reopens an order whose coupon still has uses left for others', async () => {
    const placed = await cancelled({ usage_limit_total: 5, usage_limit_per_user: 1 });

    const res = await api.patch(statusPath(placed.order), placed.admin.token, { status: 'PENDING' });

    expect(res.status).toBe(200);
    expect(await timesUsed(placed.coupon.id)).toBe(1);
  });

  it('cancel then reopen then cancel releases the use each time, never twice', async () => {
    const placed = await cancelled();

    await api.patch(statusPath(placed.order), placed.admin.token, { status: 'PENDING' });
    expect(await timesUsed(placed.coupon.id)).toBe(1);
    await api.patch(statusPath(placed.order), placed.admin.token, { status: 'CANCELLED' });

    expect(await timesUsed(placed.coupon.id)).toBe(0);
  });

  it('keeps stock failures unchanged for orders with a coupon (nothing moved, use not taken)', async () => {
    const placed = await cancelled();
    await prisma.product.update({ where: { id: placed.ctx.product.id }, data: { stock: 1 } });

    const res = await api.patch(statusPath(placed.order), placed.admin.token, { status: 'PENDING' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('CANNOT_REOPEN');
    expect((await prisma.order.findUnique({ where: { id: placed.order.id } })).status).toBe('CANCELLED');
    expect(await stockOf(placed.ctx.product.id)).toBe(1);
    expect(await timesUsed(placed.coupon.id)).toBe(0);
  });
});
