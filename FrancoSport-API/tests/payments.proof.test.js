import { describe, it, expect, beforeEach, vi } from 'vitest';
import { api, images, prisma, createContext, createOrderRecord, createOrderViaApi } from './helpers.js';
import * as storage from '../src/services/storage.service.js';

// Only the storage adapter is mocked: Cloudinary is never reached
vi.mock('../src/services/storage.service.js', () => {
  let n = 0;
  return {
    uploadImageBuffer: vi.fn(async (buffer, { folder }) => ({
      url: `https://cdn.test/${folder}/img-${++n}.png`,
      public_id: `${folder}/img-${n}`,
      width: 1,
      height: 1,
      format: 'png',
      bytes: buffer.length,
    })),
    deleteStoredImage: vi.fn(async () => ({ result: 'ok' })),
  };
});

const proof = (orderId, token, file = images.png()) =>
  api.upload(`/api/payment/proof/${orderId}`, token, 'image', [file]);

const reload = (id) => prisma.order.findUnique({ where: { id } });
const historyOf = (id) => prisma.orderStatusHistory.findMany({ where: { order_id: id }, orderBy: { id: 'asc' } });

describe('POST /api/payment/proof/:orderId', () => {
  let ctx;

  beforeEach(async () => {
    vi.clearAllMocks();
    ctx = await createContext();
  });

  it.each(['BANK_TRANSFER', 'QR_TRANSFER'])('the owner uploads a proof for a pending %s order', async (payment_method) => {
    const order = await createOrderRecord(ctx, { payment_method });
    const res = await proof(order.id, ctx.token);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Comprobante subido exitosamente. El pago está en revisión.');
    expect(storage.uploadImageBuffer).toHaveBeenCalledTimes(1);
    expect(storage.uploadImageBuffer.mock.calls[0][1]).toEqual({ folder: 'franco-sport/payment-proofs' });

    const saved = await reload(order.id);
    expect(saved.payment_proof_url).toMatch(/^https:\/\/cdn\.test\/franco-sport\/payment-proofs\//);
    expect(saved.payment_status).toBe('PENDING');
    expect(saved.status).toBe('PENDING');

    const history = await historyOf(order.id);
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({ status: 'PENDING', notes: 'Comprobante de pago subido', created_by: ctx.user.id });
  });

  it('accepts jpeg and webp proofs', async () => {
    const order = await createOrderRecord(ctx);
    expect((await proof(order.id, ctx.token, images.jpeg())).status).toBe(200);
    expect((await proof(order.id, ctx.token, images.webp())).status).toBe(200);
  });

  it('replaces the proof while the payment is pending and records it', async () => {
    const order = await createOrderRecord(ctx);
    await proof(order.id, ctx.token);
    const first = (await reload(order.id)).payment_proof_url;
    const res = await proof(order.id, ctx.token);

    expect(res.status).toBe(200);
    const saved = await reload(order.id);
    expect(saved.payment_proof_url).not.toBe(first);
    const history = await historyOf(order.id);
    expect(history.map((h) => h.notes)).toEqual(['Comprobante de pago subido', 'Comprobante de pago reemplazado']);
  });

  it('allows a new proof when the payment was rejected (FAILED), back to pending', async () => {
    const order = await createOrderRecord(ctx, { payment_status: 'FAILED', payment_proof_url: 'https://cdn.test/old.png' });
    const res = await proof(order.id, ctx.token);
    expect(res.status).toBe(200);
    const saved = await reload(order.id);
    expect(saved.payment_status).toBe('PENDING');
    expect(saved.payment_proof_url).not.toBe('https://cdn.test/old.png');
  });

  it('a foreign order and a missing order get the same response; nothing is stored or changed', async () => {
    const other = await createContext();
    const foreign = await createOrderRecord(other);
    const before = await reload(foreign.id);

    const asForeign = await proof(foreign.id, ctx.token);
    const asMissing = await proof(999999999, ctx.token);

    expect(asForeign.status).toBe(404);
    expect(asForeign.status).toBe(asMissing.status);
    expect(asForeign.body).toEqual(asMissing.body);
    expect(asForeign.body.error.message).toBe('Pedido no encontrado');
    expect(storage.uploadImageBuffer).not.toHaveBeenCalled();
    expect(await reload(foreign.id)).toEqual(before);
    expect(await historyOf(foreign.id)).toHaveLength(0);
  });

  it('an admin cannot upload a proof for somebody else’s order either', async () => {
    const { createUser } = await import('./helpers.js');
    const admin = await createUser({ role: 'ADMIN' });
    const order = await createOrderRecord(ctx);
    const res = await proof(order.id, admin.token);
    expect(res.status).toBe(404);
    expect((await reload(order.id)).payment_proof_url).toBeNull();
  });

  it('a guest gets 401', async () => {
    const order = await createOrderRecord(ctx);
    const res = await proof(order.id, null);
    expect(res.status).toBe(401);
    expect(storage.uploadImageBuffer).not.toHaveBeenCalled();
  });

  it.each([
    ['cancelled', { status: 'CANCELLED' }, 'No se puede subir un comprobante a un pedido cancelado'],
    ['already paid', { payment_status: 'PAID' }, 'El pago de este pedido ya fue procesado'],
    ['refunded', { payment_status: 'REFUNDED' }, 'El pago de este pedido ya fue procesado'],
    ['shipped', { status: 'SHIPPED' }, 'El pedido ya no admite comprobantes de pago'],
    ['cash on delivery', { payment_method: 'CASH_ON_DELIVERY' }, 'Este pedido no se paga por transferencia'],
  ])('rejects a %s order and changes nothing', async (_name, overrides, message) => {
    const order = await createOrderRecord(ctx, overrides);
    const before = await reload(order.id);

    const res = await proof(order.id, ctx.token);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toBe(message);
    expect(storage.uploadImageBuffer).not.toHaveBeenCalled();
    expect(await reload(order.id)).toEqual(before);
    expect(await historyOf(order.id)).toHaveLength(0);
  });

  it('rejects a request without a file', async () => {
    const order = await createOrderRecord(ctx);
    const res = await api.post(`/api/payment/proof/${order.id}`, ctx.token, {});
    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('No se ha subido ningún comprobante');
  });

  it.each([
    ['text renamed .png', images.fakePng, 'El archivo no es una imagen válida. Solo se permiten imágenes JPG, PNG y WEBP.'],
    ['a text file', images.text, 'Tipo de archivo no permitido. Solo se permiten imágenes JPG, PNG y WEBP.'],
    ['a gif', images.gif, 'Tipo de archivo no permitido. Solo se permiten imágenes JPG, PNG y WEBP.'],
    ['an image over 5 MB', images.oversizePng, 'La imagen no puede superar los 5 MB'],
  ])('rejects %s and changes nothing', async (_name, make, message) => {
    const order = await createOrderRecord(ctx);
    const before = await reload(order.id);

    const res = await proof(order.id, ctx.token, make());

    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe(message);
    expect(storage.uploadImageBuffer).not.toHaveBeenCalled();
    expect(await reload(order.id)).toEqual(before);
    expect(await historyOf(order.id)).toHaveLength(0);
  });

  it('limits uploads per user (429 after 10 in the window), other users are not affected', async () => {
    const order = await createOrderRecord(ctx);
    for (let i = 0; i < 10; i++) expect((await proof(order.id, ctx.token)).status).toBe(200);

    const limited = await proof(order.id, ctx.token);
    expect(limited.status).toBe(429);
    expect(limited.body.error.message).toBe('Demasiados intentos de subida de comprobantes; intente más tarde');
    expect(storage.uploadImageBuffer).toHaveBeenCalledTimes(10);

    const other = await createContext();
    const otherOrder = await createOrderRecord(other);
    expect((await proof(otherOrder.id, other.token)).status).toBe(200);
  });

  it('order creation ignores a payment_proof_url sent by the client', async () => {
    const res = await createOrderViaApi(ctx, {
      payment_method: 'BANK_TRANSFER',
      payment_proof_url: 'https://evil.test/fake.png',
    });
    expect(res.status).toBe(201);
    const saved = await prisma.order.findFirst({ where: { user_id: ctx.user.id } });
    expect(saved.payment_proof_url).toBeNull();
  });

  it('an order created through the API accepts its proof afterwards (checkout flow)', async () => {
    const created = await createOrderViaApi(ctx, { payment_method: 'BANK_TRANSFER' });
    expect(created.status).toBe(201);
    const res = await proof(created.body.data.id, ctx.token);
    expect(res.status).toBe(200);
  });

  it('retry: after a failed upload the customer can send the proof again from the order detail', async () => {
    const created = await createOrderViaApi(ctx, { payment_method: 'BANK_TRANSFER' });
    const id = created.body.data.id;

    expect((await proof(id, ctx.token, images.fakePng())).status).toBe(400);
    const pending = await api.get(`/api/orders/${created.body.data.order_number}`, ctx.token);
    expect(pending.body.data).toMatchObject({ payment_method: 'BANK_TRANSFER', payment_status: 'PENDING', payment_proof_url: null });

    expect((await proof(id, ctx.token)).status).toBe(200);
    const sent = await api.get(`/api/orders/${created.body.data.order_number}`, ctx.token);
    expect(sent.body.data.payment_proof_url).toMatch(/^https:\/\/cdn\.test\//);
  });
});
