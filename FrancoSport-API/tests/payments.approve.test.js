import { describe, it, expect, beforeEach } from 'vitest';
import { api, prisma, createContext, createUser, createOrderRecord } from './helpers.js';

const PROOF = 'https://cdn.test/franco-sport/payment-proofs/p.png';
const CHANGED = 'El pedido cambió mientras tanto; recargue e intente de nuevo';

const approve = (orderId, token) => api.post(`/api/admin/payment/approve/${orderId}`, token, {});
const reload = (id) => prisma.order.findUnique({ where: { id } });
const historyOf = (id) => prisma.orderStatusHistory.findMany({ where: { order_id: id }, orderBy: { id: 'asc' } });
const sideEffects = (ctx) =>
  Promise.all([
    prisma.loyaltyTransaction.count({ where: { user_id: ctx.user.id } }),
    prisma.user.findUnique({ where: { id: ctx.user.id }, select: { loyalty_points: true } }),
  ]);

describe('POST /api/admin/payment/approve/:orderId', () => {
  let ctx;
  let admin;

  beforeEach(async () => {
    ctx = await createContext();
    admin = await createUser({ role: 'ADMIN' });
  });

  it('approves a pending payment with a proof: PAID, PROCESSING and one history row', async () => {
    const order = await createOrderRecord(ctx, { payment_proof_url: PROOF });
    const pointsBefore = await sideEffects(ctx);

    const res = await approve(order.id, admin.token);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Pago aprobado exitosamente');
    expect(res.body.data).toMatchObject({ id: order.id, payment_status: 'PAID', status: 'PROCESSING' });

    const saved = await reload(order.id);
    expect(saved).toMatchObject({ payment_status: 'PAID', status: 'PROCESSING', payment_proof_url: PROOF });
    const history = await historyOf(order.id);
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({
      status: 'PROCESSING',
      notes: 'Pago aprobado por administrador',
      created_by: admin.user.id,
    });
    // no points or other side effects, exactly as before
    expect(await sideEffects(ctx)).toEqual(pointsBefore);
  });

  it('approves an order already in PROCESSING with a pending payment', async () => {
    const order = await createOrderRecord(ctx, { status: 'PROCESSING', payment_proof_url: PROOF });
    const res = await approve(order.id, admin.token);
    expect(res.status).toBe(200);
    expect((await reload(order.id)).payment_status).toBe('PAID');
  });

  it('a customer gets 403 and nothing changes', async () => {
    const order = await createOrderRecord(ctx, { payment_proof_url: PROOF });
    const before = await reload(order.id);
    const res = await approve(order.id, ctx.token);
    expect(res.status).toBe(403);
    expect(res.body.error.message).toBe('Acceso denegado. Se requieren permisos de administrador.');
    expect(await reload(order.id)).toEqual(before);
    expect(await historyOf(order.id)).toHaveLength(0);
  });

  it('a guest gets 401 and nothing changes', async () => {
    const order = await createOrderRecord(ctx, { payment_proof_url: PROOF });
    const before = await reload(order.id);
    const res = await approve(order.id, null);
    expect(res.status).toBe(401);
    expect(await reload(order.id)).toEqual(before);
  });

  it('answers 404 for a missing order', async () => {
    const res = await approve(999999999, admin.token);
    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe('Pedido no encontrado');
  });

  it.each([
    ['cancelled', { status: 'CANCELLED' }, 400, 'No se puede aprobar el pago de un pedido cancelado'],
    ['refunded (payment)', { payment_status: 'REFUNDED' }, 400, 'No se puede aprobar el pago de un pedido reembolsado'],
    ['refunded (status)', { status: 'REFUNDED' }, 400, 'No se puede aprobar el pago de un pedido reembolsado'],
    ['already paid', { payment_status: 'PAID' }, 409, 'El pago de este pedido ya fue aprobado'],
    ['rejected payment', { payment_status: 'FAILED' }, 400, 'El pago de este pedido fue rechazado; el cliente debe subir un nuevo comprobante'],
    ['already shipped', { status: 'SHIPPED' }, 400, 'El pedido no está en un estado que permita aprobar el pago'],
  ])('rejects a %s order and changes nothing', async (_name, overrides, status, message) => {
    const order = await createOrderRecord(ctx, { payment_proof_url: PROOF, ...overrides });
    const before = await reload(order.id);
    const pointsBefore = await sideEffects(ctx);

    const res = await approve(order.id, admin.token);

    expect(res.status).toBe(status);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toBe(message);
    expect(await reload(order.id)).toEqual(before);
    expect(await historyOf(order.id)).toHaveLength(0);
    expect(await sideEffects(ctx)).toEqual(pointsBefore);
  });

  it('rejects an order without a proof (e.g. cash on delivery) and changes nothing', async () => {
    const order = await createOrderRecord(ctx, { payment_method: 'CASH_ON_DELIVERY' });
    const before = await reload(order.id);
    const res = await approve(order.id, admin.token);
    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('El pedido no tiene comprobante de pago');
    expect(await reload(order.id)).toEqual(before);
    expect(await historyOf(order.id)).toHaveLength(0);
  });

  it('a second (repeated) approval is a 409 and changes nothing more', async () => {
    const order = await createOrderRecord(ctx, { payment_proof_url: PROOF });
    expect((await approve(order.id, admin.token)).status).toBe(200);
    const afterFirst = await reload(order.id);

    const second = await approve(order.id, admin.token);

    expect(second.status).toBe(409);
    expect(second.body.success).toBe(false);
    expect(await reload(order.id)).toEqual(afterFirst);
    expect(await historyOf(order.id)).toHaveLength(1);
  });

  it('concurrent approvals have one winner, the rest get 409 "El pedido cambió mientras tanto"', async () => {
    const order = await createOrderRecord(ctx, { payment_proof_url: PROOF });

    const results = await Promise.all(Array.from({ length: 6 }, () => approve(order.id, admin.token)));

    const wins = results.filter((r) => r.status === 200);
    const conflicts = results.filter((r) => r.status === 409);
    expect(wins).toHaveLength(1);
    expect(conflicts).toHaveLength(5);
    for (const c of conflicts) {
      expect(c.body.error.message).toMatch(new RegExp(`^(${CHANGED}|El pago de este pedido ya fue aprobado)$`));
    }
    expect(await historyOf(order.id)).toHaveLength(1);
    expect(await reload(order.id)).toMatchObject({ payment_status: 'PAID', status: 'PROCESSING' });
  });

  it('an approval racing a cancellation never leaves a cancelled order paid', async () => {
    const order = await createOrderRecord(ctx, { payment_proof_url: PROOF });
    const [approved, cancelled] = await Promise.all([
      approve(order.id, admin.token),
      api.patch(`/api/admin/orders/${order.order_number}/status`, admin.token, { status: 'CANCELLED' }),
    ]);
    const saved = await reload(order.id);
    // whichever came first wins; the other is rejected, never both applied
    expect([approved.status, cancelled.status].filter((s) => s === 200 || s === 409 || s === 400)).toHaveLength(2);
    expect(saved.status === 'CANCELLED' && saved.payment_status === 'PAID').toBe(false);
  });

  it('the payment config route stays admin only', async () => {
    const res = await api.post('/api/admin/payment/approve/1', ctx.token, {});
    expect(res.status).toBe(403);
  });
});
