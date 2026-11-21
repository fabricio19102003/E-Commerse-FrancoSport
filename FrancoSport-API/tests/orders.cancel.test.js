import { describe, it, expect, vi, afterEach } from 'vitest';
import { api, prisma, createContext, createUser, createProduct, createVariant, createOrderViaApi, snapshotOf } from './helpers.js';
import { errorHandler } from '../src/middleware/errorHandler.js';

const stockOf = async (id) => (await prisma.product.findUnique({ where: { id } })).stock;
const pointsOf = async (id) => (await prisma.user.findUnique({ where: { id } })).loyalty_points;

// An order with stock taken and points redeemed through the real API
const placeOrder = async (opts = {}) => {
  const ctx = await createContext({ points: 1000, product: { stock: 10 }, ...opts });
  const variant = await createVariant(ctx.product.id, { price: '4.00', stock: 5 });
  const res = await createOrderViaApi(ctx, {
    items: [
      { product_id: ctx.product.id, quantity: 3 },
      { product_id: ctx.product.id, variant_id: variant.id, quantity: 2 },
    ],
    redeem_points: 400,
  });
  expect(res.status).toBe(201);
  expect(await stockOf(ctx.product.id)).toBe(7);
  expect(await pointsOf(ctx.user.id)).toBe(600);
  return { ctx, variant, order: res.body.data };
};

const variantStock = async (id) => (await prisma.productVariant.findUnique({ where: { id } })).stock;

const expectRestored = async ({ ctx, variant }) => {
  expect(await stockOf(ctx.product.id)).toBe(10);
  expect(await variantStock(variant.id)).toBe(5);
  expect(await pointsOf(ctx.user.id)).toBe(1000);
  const refunds = await prisma.loyaltyTransaction.findMany({ where: { user_id: ctx.user.id, type: 'REFUNDED' } });
  expect(refunds.map((t) => t.points)).toEqual([400]);
};

describe('POST /api/orders/:orderNumber/cancel (S5, S6)', () => {
  it('keeps the response shape of a create + cancel happy path', async () => {
    const ctx = await createContext();
    const created = await createOrderViaApi(ctx);
    expect(created.status).toBe(201);
    expect(Object.keys(created.body).sort()).toEqual(['data', 'message', 'success']);

    const res = await api.post(`/api/orders/${created.body.data.order_number}/cancel`, ctx.token, { reason: 'Cambié de opinión' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, message: 'Pedido cancelado exitosamente' });
    const order = await prisma.order.findUnique({ where: { id: created.body.data.id } });
    expect(order.status).toBe('CANCELLED');
    expect(order.cancelled_reason).toBe('Cambié de opinión');
  });

  it('restores stock and points', async () => {
    const placed = await placeOrder();

    const res = await api.post(`/api/orders/${placed.order.order_number}/cancel`, placed.ctx.token, { reason: 'Ya no lo quiero' });

    expect(res.status).toBe(200);
    await expectRestored(placed);
    const history = await prisma.orderStatusHistory.findMany({ where: { order_id: placed.order.id, status: 'CANCELLED' } });
    expect(history).toHaveLength(1);
  });

  it('restores only once when cancelled twice', async () => {
    const placed = await placeOrder();
    const path = `/api/orders/${placed.order.order_number}/cancel`;

    const first = await api.post(path, placed.ctx.token, { reason: 'Uno' });
    const second = await api.post(path, placed.ctx.token, { reason: 'Dos' });

    expect(first.status).toBe(200);
    expect(second.status).toBe(400);
    expect(second.body).toEqual({
      success: false,
      error: { code: 'CANNOT_CANCEL', message: 'Este pedido no puede ser cancelado' },
    });
    await expectRestored(placed);
  });

  it('restores only once when cancelled concurrently', async () => {
    const placed = await placeOrder();
    const path = `/api/orders/${placed.order.order_number}/cancel`;

    const responses = await Promise.all([1, 2, 3, 4].map((n) => api.post(path, placed.ctx.token, { reason: `Intento ${n}` })));

    expect(responses.filter((r) => r.status === 200)).toHaveLength(1);
    for (const r of responses.filter((r) => r.status !== 200)) {
      expect(r.status).toBe(400);
      expect(r.body.error.message).toBe('Este pedido no puede ser cancelado');
    }
    await expectRestored(placed);
    expect(await prisma.orderStatusHistory.count({ where: { order_id: placed.order.id, status: 'CANCELLED' } })).toBe(1);
  });

  it('returns no points for an order that redeemed none', async () => {
    const ctx = await createContext({ points: 50 });
    const created = await createOrderViaApi(ctx);

    const res = await api.post(`/api/orders/${created.body.data.order_number}/cancel`, ctx.token, { reason: 'x' });

    expect(res.status).toBe(200);
    expect(await pointsOf(ctx.user.id)).toBe(50);
    expect(await prisma.loyaltyTransaction.count({ where: { user_id: ctx.user.id } })).toBe(0);
  });

  it('does not let another customer cancel the order', async () => {
    const placed = await placeOrder();
    const other = await createUser();
    const before = await snapshotOf(placed.ctx);

    const res = await api.post(`/api/orders/${placed.order.order_number}/cancel`, other.token, { reason: 'x' });

    expect(res.status).toBe(403);
    expect(res.body.error.message).toBe('No tienes acceso a este pedido');
    expect(await snapshotOf(placed.ctx)).toEqual(before);
  });
});

describe('admin cancellation (S5, S6)', () => {
  it('POST /api/admin/orders/:orderNumber/cancel restores stock and points once', async () => {
    const placed = await placeOrder();
    const admin = await createUser({ role: 'ADMIN' });
    const path = `/api/admin/orders/${placed.order.order_number}/cancel`;

    const first = await api.post(path, admin.token, { reason: 'Sin stock real' });
    const second = await api.post(path, admin.token, { reason: 'Sin stock real' });

    expect(first.status).toBe(200);
    expect(first.body.success).toBe(true);
    expect(first.body.message).toBe('Pedido cancelado exitosamente');
    expect(first.body.data.status).toBe('CANCELLED');
    expect(second.status).toBe(400);
    expect(second.body.error.message).toBe('El pedido no puede ser cancelado en su estado actual');
    await expectRestored(placed);
  });

  it('PATCH status to CANCELLED restores stock and points once', async () => {
    const placed = await placeOrder();
    const admin = await createUser({ role: 'ADMIN' });
    const path = `/api/admin/orders/${placed.order.order_number}/status`;

    const first = await api.patch(path, admin.token, { status: 'CANCELLED', notes: 'Cancelado por el administrador' });
    const second = await api.patch(path, admin.token, { status: 'CANCELLED' });

    expect(first.status).toBe(200);
    expect(first.body.success).toBe(true);
    expect(first.body.data.status).toBe('CANCELLED');
    expect(second.status).toBe(400);
    expect(second.body.error.message).toBe('El pedido no puede ser cancelado en su estado actual');
    await expectRestored(placed);
  });

  it('does not restore twice when customer and admin both cancel', async () => {
    const placed = await placeOrder();
    const admin = await createUser({ role: 'ADMIN' });

    await api.post(`/api/orders/${placed.order.order_number}/cancel`, placed.ctx.token, { reason: 'x' });
    const viaStatus = await api.patch(`/api/admin/orders/${placed.order.order_number}/status`, admin.token, { status: 'CANCELLED' });
    const viaCancel = await api.post(`/api/admin/orders/${placed.order.order_number}/cancel`, admin.token, { reason: 'x' });

    expect(viaStatus.status).toBe(400);
    expect(viaCancel.status).toBe(400);
    await expectRestored(placed);
  });

  it.each(['PROCESSING', 'PAID', 'SHIPPED', 'DELIVERED'])('does not allow moving a CANCELLED order to %s', async (status) => {
    const placed = await placeOrder();
    const admin = await createUser({ role: 'ADMIN' });
    const path = `/api/admin/orders/${placed.order.order_number}/status`;
    await api.patch(path, admin.token, { status: 'CANCELLED' });

    const res = await api.patch(path, admin.token, { status });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('Un pedido cancelado solo puede reabrirse a estado PENDING');
    expect((await prisma.order.findUnique({ where: { id: placed.order.id } })).status).toBe('CANCELLED');
    await expectRestored(placed);
  });

  it('cannot cancel a shipped order through the status route', async () => {
    const placed = await placeOrder();
    const admin = await createUser({ role: 'ADMIN' });
    const path = `/api/admin/orders/${placed.order.order_number}/status`;
    await api.patch(path, admin.token, { status: 'SHIPPED' });

    const res = await api.patch(path, admin.token, { status: 'CANCELLED' });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('El pedido no puede ser cancelado en su estado actual');
    expect(await stockOf(placed.ctx.product.id)).toBe(7);
    expect(await pointsOf(placed.ctx.user.id)).toBe(600);
  });

  it('keeps the admin approve flow working (PROCESSING, PAID)', async () => {
    const placed = await placeOrder();
    const admin = await createUser({ role: 'ADMIN' });
    const path = `/api/admin/orders/${placed.order.order_number}/status`;

    const processing = await api.patch(path, admin.token, { status: 'PROCESSING' });
    const paid = await api.patch(path, admin.token, { status: 'PAID' });

    expect(processing.status).toBe(200);
    expect(processing.body.message).toBe('Estado del pedido actualizado exitosamente');
    expect(processing.body.data.status).toBe('PROCESSING');
    expect(paid.status).toBe(200);
    expect(paid.body.data.status).toBe('PAID');
  });

  it('still rejects invalid statuses', async () => {
    const placed = await placeOrder();
    const admin = await createUser({ role: 'ADMIN' });

    const res = await api.patch(`/api/admin/orders/${placed.order.order_number}/status`, admin.token, { status: 'NOPE' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('admin reopen of a cancelled order (S7)', () => {
  const adminCancel = (placed, admin) =>
    api.patch(`/api/admin/orders/${placed.order.order_number}/status`, admin.token, { status: 'CANCELLED', notes: 'Cancelado' });
  const adminReopen = (placed, admin, body = {}) =>
    api.patch(`/api/admin/orders/${placed.order.order_number}/status`, admin.token, { status: 'PENDING', ...body });
  const orderOf = (placed) => prisma.order.findUnique({ where: { id: placed.order.id } });

  const expectHeld = async (placed) => {
    expect(await stockOf(placed.ctx.product.id)).toBe(7);
    expect(await variantStock(placed.variant.id)).toBe(3);
    expect(await pointsOf(placed.ctx.user.id)).toBe(600);
  };

  it('takes stock and points again and records it in the history', async () => {
    const placed = await placeOrder();
    const admin = await createUser({ role: 'ADMIN' });
    await adminCancel(placed, admin);
    await expectRestored(placed);

    const res = await adminReopen(placed, admin);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Estado del pedido actualizado exitosamente');
    expect(res.body.data.status).toBe('PENDING');
    await expectHeld(placed);
    const order = await orderOf(placed);
    expect(order.status).toBe('PENDING');
    expect(order.cancelled_at).toBeNull();
    expect(order.cancelled_reason).toBeNull();
    const history = await prisma.orderStatusHistory.findMany({ where: { order_id: placed.order.id }, orderBy: { id: 'asc' } });
    expect(history.map((h) => h.status)).toEqual(['PENDING', 'CANCELLED', 'PENDING']);
    expect(history[2]).toMatchObject({ notes: 'Pedido reabierto por el administrador', created_by: admin.user.id });
    const redeemed = await prisma.loyaltyTransaction.findMany({ where: { order_id: placed.order.id, type: 'REDEEMED' } });
    expect(redeemed.map((t) => t.points)).toEqual([-400, -400]);
  });

  it('is idempotent: repeating the reopen moves nothing more', async () => {
    const placed = await placeOrder();
    const admin = await createUser({ role: 'ADMIN' });
    await adminCancel(placed, admin);

    const first = await adminReopen(placed, admin);
    const second = await adminReopen(placed, admin);
    const concurrent = await Promise.all([adminReopen(placed, admin), adminReopen(placed, admin)]);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(concurrent.map((r) => r.status)).toEqual([200, 200]);
    await expectHeld(placed);
    expect((await orderOf(placed)).status).toBe('PENDING');
  });

  it('reopens only once when requested concurrently', async () => {
    const placed = await placeOrder();
    const admin = await createUser({ role: 'ADMIN' });
    await adminCancel(placed, admin);

    const responses = await Promise.all([1, 2, 3, 4].map(() => adminReopen(placed, admin)));

    expect(responses.every((r) => r.status === 200)).toBe(true);
    await expectHeld(placed);
  });

  it('keeps totals exact through cancel, reopen, cancel, reopen', async () => {
    const placed = await placeOrder();
    const admin = await createUser({ role: 'ADMIN' });

    await adminCancel(placed, admin);
    await expectRestored(placed);
    expect((await adminReopen(placed, admin)).status).toBe(200);
    await expectHeld(placed);
    expect((await adminCancel(placed, admin)).status).toBe(200);
    expect(await stockOf(placed.ctx.product.id)).toBe(10);
    expect(await variantStock(placed.variant.id)).toBe(5);
    expect(await pointsOf(placed.ctx.user.id)).toBe(1000);
    expect((await adminReopen(placed, admin)).status).toBe(200);
    await expectHeld(placed);

    // The customer can cancel again and gets back exactly what the order holds
    const cancel = await api.post(`/api/orders/${placed.order.order_number}/cancel`, placed.ctx.token, { reason: 'Final' });
    expect(cancel.status).toBe(200);
    expect(await stockOf(placed.ctx.product.id)).toBe(10);
    expect(await variantStock(placed.variant.id)).toBe(5);
    expect(await pointsOf(placed.ctx.user.id)).toBe(1000);
  });

  it('changes nothing when a product no longer has enough stock', async () => {
    const placed = await placeOrder();
    const admin = await createUser({ role: 'ADMIN' });
    await adminCancel(placed, admin);
    await prisma.product.update({ where: { id: placed.ctx.product.id }, data: { stock: 2 } });
    const historyBefore = await prisma.orderStatusHistory.count({ where: { order_id: placed.order.id } });

    const res = await adminReopen(placed, admin);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toBe(`Stock insuficiente para ${placed.order.items[0].product_name} al reabrir el pedido`);
    expect((await orderOf(placed)).status).toBe('CANCELLED');
    expect(await stockOf(placed.ctx.product.id)).toBe(2);
    expect(await variantStock(placed.variant.id)).toBe(5);
    expect(await pointsOf(placed.ctx.user.id)).toBe(1000);
    expect(await prisma.orderStatusHistory.count({ where: { order_id: placed.order.id } })).toBe(historyBefore);
  });

  it('rolls back the lines already taken when a later line has no stock', async () => {
    const placed = await placeOrder();
    const admin = await createUser({ role: 'ADMIN' });
    await adminCancel(placed, admin);
    await prisma.productVariant.update({ where: { id: placed.variant.id }, data: { stock: 1 } });

    const res = await adminReopen(placed, admin);

    expect(res.status).toBe(400);
    const variantItem = placed.order.items.find((i) => i.variant_id);
    expect(res.body.error.message).toBe(`Stock insuficiente para ${variantItem.product_name} (${variantItem.variant_name}) al reabrir el pedido`);
    expect((await orderOf(placed)).status).toBe('CANCELLED');
    expect(await stockOf(placed.ctx.product.id)).toBe(10);
    expect(await variantStock(placed.variant.id)).toBe(1);
    expect(await pointsOf(placed.ctx.user.id)).toBe(1000);
  });

  it('changes nothing when the customer no longer has enough points', async () => {
    const placed = await placeOrder();
    const admin = await createUser({ role: 'ADMIN' });
    await adminCancel(placed, admin);
    await prisma.user.update({ where: { id: placed.ctx.user.id }, data: { loyalty_points: 100 } });
    const txBefore = await prisma.loyaltyTransaction.count({ where: { user_id: placed.ctx.user.id } });

    const res = await adminReopen(placed, admin);

    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('Puntos de lealtad insuficientes para reabrir el pedido: se necesitan 400');
    expect((await orderOf(placed)).status).toBe('CANCELLED');
    expect(await stockOf(placed.ctx.product.id)).toBe(10);
    expect(await variantStock(placed.variant.id)).toBe(5);
    expect(await pointsOf(placed.ctx.user.id)).toBe(100);
    expect(await prisma.loyaltyTransaction.count({ where: { user_id: placed.ctx.user.id } })).toBe(txBefore);
  });

  it('does not let a customer reopen an order', async () => {
    const placed = await placeOrder();
    const admin = await createUser({ role: 'ADMIN' });
    await adminCancel(placed, admin);

    const res = await api.patch(`/api/admin/orders/${placed.order.order_number}/status`, placed.ctx.token, { status: 'PENDING' });

    expect(res.status).toBe(403);
    expect(res.body.error.message).toBe('Acceso denegado. Se requieren permisos de administrador.');
    expect((await orderOf(placed)).status).toBe('CANCELLED');
    await expectRestored(placed);
  });
});

describe('reopen deducts what the last cancel refunded (S7)', () => {
  it('re-deducts the refunded points even when discount_amount was never stored (legacy order)', async () => {
    const placed = await placeOrder();
    const admin = await createUser({ role: 'ADMIN' });
    const path = `/api/admin/orders/${placed.order.order_number}/status`;
    await prisma.order.update({ where: { id: placed.order.id }, data: { discount_amount: 0 } });

    expect((await api.patch(path, admin.token, { status: 'CANCELLED' })).status).toBe(200);
    await expectRestored(placed);
    expect((await api.patch(path, admin.token, { status: 'PENDING' })).status).toBe(200);

    expect(await pointsOf(placed.ctx.user.id)).toBe(600);
  });

  it('deducts no points when the order never refunded any (cancelled before the fix)', async () => {
    const placed = await placeOrder();
    const admin = await createUser({ role: 'ADMIN' });
    // Legacy cancel: status changed, stock returned by hand, points never refunded
    await prisma.order.update({ where: { id: placed.order.id }, data: { status: 'CANCELLED' } });
    await prisma.product.update({ where: { id: placed.ctx.product.id }, data: { stock: 10 } });
    await prisma.productVariant.update({ where: { id: placed.variant.id }, data: { stock: 5 } });

    const res = await api.patch(`/api/admin/orders/${placed.order.order_number}/status`, admin.token, { status: 'PENDING' });

    expect(res.status).toBe(200);
    expect(await pointsOf(placed.ctx.user.id)).toBe(600);
  });

  it('puts a REFUNDED payment back to PENDING on reopen and records it in the history', async () => {
    const placed = await placeOrder();
    const admin = await createUser({ role: 'ADMIN' });
    const path = `/api/admin/orders/${placed.order.order_number}/status`;
    await prisma.order.update({ where: { id: placed.order.id }, data: { status: 'PROCESSING', payment_status: 'PAID' } });

    await api.patch(path, admin.token, { status: 'CANCELLED' });
    expect((await prisma.order.findUnique({ where: { id: placed.order.id } })).payment_status).toBe('REFUNDED');
    const res = await api.patch(path, admin.token, { status: 'PENDING' });

    expect(res.status).toBe(200);
    expect(res.body.data.payment_status).toBe('PENDING');
    expect((await prisma.order.findUnique({ where: { id: placed.order.id } })).payment_status).toBe('PENDING');
    const history = await prisma.orderStatusHistory.findMany({ where: { order_id: placed.order.id }, orderBy: { id: 'desc' }, take: 1 });
    expect(history[0].notes).toBe('Pedido reabierto por el administrador. El pago vuelve a PENDING (estaba REFUNDED)');
  });
});

describe('admin status changes are conditional claims (S5, S7)', () => {
  afterEach(() => vi.restoreAllMocks());

  it('answers 409 and changes nothing when the order changed since it was read', async () => {
    const ctx = await createContext();
    const admin = await createUser({ role: 'ADMIN' });
    const created = await createOrderViaApi(ctx);
    await prisma.order.update({ where: { id: created.body.data.id }, data: { status: 'PROCESSING' } });
    // The controller reads the order as PENDING, but another request already moved it
    vi.spyOn(prisma.order, 'findUnique').mockResolvedValueOnce({ ...created.body.data, items: undefined, user: undefined, status: 'PENDING' });
    const historyBefore = await prisma.orderStatusHistory.count({ where: { order_id: created.body.data.id } });

    const res = await api.patch(`/api/admin/orders/${created.body.data.order_number}/status`, admin.token, { status: 'SHIPPED' });

    expect(res.status).toBe(409);
    expect(res.body).toEqual({
      success: false,
      error: { code: 'ORDER_CHANGED', message: 'El pedido cambió mientras tanto; recargue e intente de nuevo' },
    });
    expect((await prisma.order.findUnique({ where: { id: created.body.data.id } })).status).toBe('PROCESSING');
    expect(await prisma.orderStatusHistory.count({ where: { order_id: created.body.data.id } })).toBe(historyBefore);
  });

  it('concurrent admin SHIPPED and customer cancel: exactly one wins and stock/points match the final status', async () => {
    for (let i = 0; i < 20; i++) {
      const placed = await placeOrder();
      const admin = await createUser({ role: 'ADMIN' });
      const num = placed.order.order_number;

      const [shipped, cancelled] = await Promise.all([
        api.patch(`/api/admin/orders/${num}/status`, admin.token, { status: 'SHIPPED' }),
        api.post(`/api/orders/${num}/cancel`, placed.ctx.token, { reason: 'x' }),
      ]);

      const final = (await prisma.order.findUnique({ where: { id: placed.order.id } })).status;
      expect([shipped.status, cancelled.status].filter((s) => s === 200)).toHaveLength(1);
      if (final === 'CANCELLED') {
        expect(shipped.status).toBe(409);
        await expectRestored(placed);
      } else {
        expect(final).toBe('SHIPPED');
        expect(cancelled.status).toBe(400);
        expect(await stockOf(placed.ctx.product.id)).toBe(7);
        expect(await variantStock(placed.variant.id)).toBe(3);
        expect(await pointsOf(placed.ctx.user.id)).toBe(600);
      }
    }
  });

  it('awards the DELIVERED points exactly once', async () => {
    const ctx = await createContext({ points: 0 });
    const admin = await createUser({ role: 'ADMIN' });
    const created = await createOrderViaApi(ctx);
    const path = `/api/admin/orders/${created.body.data.order_number}/status`;

    const responses = await Promise.all([1, 2, 3].map(() => api.patch(path, admin.token, { status: 'DELIVERED' })));
    const again = await api.patch(path, admin.token, { status: 'DELIVERED' });

    expect(responses.filter((r) => r.status === 200).length).toBeGreaterThanOrEqual(1);
    expect(again.status).toBe(200);
    expect(await pointsOf(ctx.user.id)).toBe(25); // 1 point per currency unit of the 25.00 total
    expect(await prisma.loyaltyTransaction.count({ where: { user_id: ctx.user.id, type: 'EARNED' } })).toBe(1);
  });
});

describe('lock ordering and transient conflicts (S2, S5)', () => {
  it('concurrent cancel [p2,p1] and create [p1,p2] never answers 500', async () => {
    const statuses = [];
    for (let i = 0; i < 20; i++) {
      const ctx = await createContext({ product: { stock: 50 } });
      const p2 = await createProduct({ stock: 50 });
      const first = await createOrderViaApi(ctx, {
        items: [
          { product_id: p2.id, quantity: 1 },
          { product_id: ctx.product.id, quantity: 1 },
        ],
      });
      expect(first.status).toBe(201);

      const [cancel, create] = await Promise.all([
        api.post(`/api/orders/${first.body.data.order_number}/cancel`, ctx.token, { reason: 'x' }),
        createOrderViaApi(ctx, {
          items: [
            { product_id: ctx.product.id, quantity: 1 },
            { product_id: p2.id, quantity: 1 },
          ],
        }),
      ]);
      statuses.push(cancel.status, create.status);
      // cancel returned its units, create took its own: net stock is 50 - 1 each
      expect(await stockOf(ctx.product.id)).toBe(49);
      expect(await stockOf(p2.id)).toBe(49);
    }
    expect(statuses.filter((s) => s >= 500)).toEqual([]);
  });

  it('maps a Prisma P2034 write conflict / deadlock to 409 with a retry message', () => {
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    vi.spyOn(console, 'error').mockImplementation(() => {});

    errorHandler({ code: 'P2034' }, {}, res, () => {});

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: 'CONFLICT', message: 'Conflicto temporal al procesar el pedido; intente de nuevo' },
    });
  });
});
