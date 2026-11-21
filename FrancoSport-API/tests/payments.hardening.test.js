import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { api, app, images, prisma, createContext, createUser, createOrderRecord } from './helpers.js';
import { cancelOrderInTransaction } from '../src/services/order.service.js';
import * as storage from '../src/services/storage.service.js';

// Only the storage adapter is mocked: Cloudinary is never reached.
// `hooks.onUpload` lets a test change the database while an upload is in flight.
const hooks = vi.hoisted(() => ({ onUpload: null }));
vi.mock('../src/services/storage.service.js', () => {
  let n = 0;
  return {
    uploadImageBuffer: vi.fn(async (buffer, { folder }) => {
      if (hooks.onUpload) await hooks.onUpload();
      n += 1;
      return {
        url: `https://cdn.test/${folder}/v-${n}.png`,
        public_id: `${folder}/v-${n}`,
        width: 1,
        height: 1,
        format: 'png',
        bytes: buffer.length,
      };
    }),
    deleteStoredImage: vi.fn(async () => ({ result: 'ok' })),
  };
});

const PNG = images.png().buffer;
const PROOF = 'https://cdn.test/franco-sport/payment-proofs/seen.png';
const CHANGED = 'El pedido cambió mientras tanto; recargue e intente de nuevo';
const PROOF_CHANGED = 'El comprobante cambió mientras tanto; revíselo de nuevo';
const PAID_CANCEL = 'Su pago ya fue aprobado: para cancelar el pedido comuníquese con la tienda';

const reload = (id) => prisma.order.findUnique({ where: { id } });
const historyOf = (id) => prisma.orderStatusHistory.findMany({ where: { order_id: id } });
const proof = (id, token, file = images.png()) => api.upload(`/api/payment/proof/${id}`, token, 'image', [file]);
const approveAs = (admin, id, body = {}) => api.post(`/api/admin/payment/approve/${id}`, admin.token, body);

/**
 * Make the next read of an order return what it was before `change` ran,
 * i.e. simulate a request that read the order just before another one wrote it.
 */
const staleNextRead = (change) => {
  const real = prisma.order.findUnique.bind(prisma.order);
  return vi.spyOn(prisma.order, 'findUnique').mockImplementationOnce(async (args) => {
    const stale = await real(args);
    await change();
    return stale;
  });
};

beforeEach(() => {
  vi.clearAllMocks();
  hooks.onUpload = null;
});
afterEach(() => vi.restoreAllMocks());

describe('cancel claims the payment status it read (fix 1)', () => {
  let ctx;
  let admin;
  beforeEach(async () => {
    ctx = await createContext();
    admin = await createUser({ role: 'ADMIN' });
  });

  it('the service does not cancel with a stale payment status', async () => {
    const order = await createOrderRecord(ctx, { payment_proof_url: PROOF });
    const stale = await reload(order.id);
    await prisma.order.update({ where: { id: order.id }, data: { payment_status: 'PAID', status: 'PROCESSING' } });
    const before = await reload(order.id);

    const result = await prisma.$transaction((tx) =>
      cancelOrderInTransaction(tx, stale, { reason: 'x', historyNotes: 'x' })
    );

    expect(result).toBeNull();
    expect(await reload(order.id)).toEqual(before);
    expect(await historyOf(order.id)).toHaveLength(0);
  });

  it('admin PATCH status CANCELLED racing an approval answers 409 and leaves the paid order alone', async () => {
    const order = await createOrderRecord(ctx, { payment_proof_url: PROOF });
    staleNextRead(() =>
      prisma.order.update({ where: { id: order.id }, data: { payment_status: 'PAID', status: 'PROCESSING' } })
    );

    const res = await api.patch(`/api/admin/orders/${order.order_number}/status`, admin.token, { status: 'CANCELLED' });

    expect(res.status).toBe(409);
    expect(res.body.error.message).toBe(CHANGED);
    expect(await reload(order.id)).toMatchObject({ status: 'PROCESSING', payment_status: 'PAID', cancelled_at: null });
    expect(await historyOf(order.id)).toHaveLength(0);
  });

  it('admin POST cancel racing an approval answers 409 and leaves the paid order alone', async () => {
    const order = await createOrderRecord(ctx, { payment_proof_url: PROOF });
    staleNextRead(() =>
      prisma.order.update({ where: { id: order.id }, data: { payment_status: 'PAID', status: 'PROCESSING' } })
    );

    const res = await api.post(`/api/admin/orders/${order.order_number}/cancel`, admin.token, { reason: 'x' });

    expect(res.status).toBe(409);
    expect(res.body.error.message).toBe(CHANGED);
    expect(await reload(order.id)).toMatchObject({ status: 'PROCESSING', payment_status: 'PAID' });
  });

  it('admin cancel of an order that is already PAID still refunds it (unchanged)', async () => {
    const order = await createOrderRecord(ctx, { payment_proof_url: PROOF, status: 'PROCESSING', payment_status: 'PAID' });
    const res = await api.patch(`/api/admin/orders/${order.order_number}/status`, admin.token, { status: 'CANCELLED' });
    expect(res.status).toBe(200);
    expect(await reload(order.id)).toMatchObject({ status: 'CANCELLED', payment_status: 'REFUNDED' });
  });
});

describe('customer cancel of an approved order (item 7)', () => {
  let ctx;
  let admin;
  beforeEach(async () => {
    ctx = await createContext();
    admin = await createUser({ role: 'ADMIN' });
  });

  const cancel = (order, token = ctx.token) => api.post(`/api/orders/${order.order_number}/cancel`, token, { reason: 'x' });

  it('approve -> customer cancel is rejected with 400 and nothing changes', async () => {
    const order = await createOrderRecord(ctx, { payment_proof_url: PROOF });
    expect((await approveAs(admin, order.id)).status).toBe(200);
    const before = await reload(order.id);
    const historyBefore = await historyOf(order.id);

    const res = await cancel(order);

    expect(res.status).toBe(400);
    expect(res.body.error).toEqual({ code: 'CANNOT_CANCEL', message: PAID_CANCEL });
    expect(await reload(order.id)).toEqual(before);
    expect(before).toMatchObject({ status: 'PROCESSING', payment_status: 'PAID' });
    expect(await historyOf(order.id)).toEqual(historyBefore);
  });

  it('a paid order keeps its stock and points when the customer tries to cancel', async () => {
    const stockBefore = (await prisma.product.findUnique({ where: { id: ctx.product.id } })).stock;
    const order = await createOrderRecord(ctx, { payment_proof_url: PROOF, status: 'PROCESSING', payment_status: 'PAID' });
    await prisma.orderItem.create({
      data: { order_id: order.id, product_id: ctx.product.id, product_name: 'p', quantity: 2, price_at_purchase: '10.00', subtotal: '20.00' },
    });
    const pointsBefore = (await prisma.user.findUnique({ where: { id: ctx.user.id } })).loyalty_points;

    expect((await cancel(order)).status).toBe(400);

    expect((await prisma.product.findUnique({ where: { id: ctx.product.id } })).stock).toBe(stockBefore);
    expect((await prisma.user.findUnique({ where: { id: ctx.user.id } })).loyalty_points).toBe(pointsBefore);
    expect(await prisma.loyaltyTransaction.count({ where: { user_id: ctx.user.id } })).toBe(0);
  });

  it('an approval landing in the middle of a customer cancel makes the cancel lose with 409', async () => {
    const order = await createOrderRecord(ctx, { payment_proof_url: PROOF });
    staleNextRead(() =>
      prisma.order.update({ where: { id: order.id }, data: { payment_status: 'PAID', status: 'PROCESSING' } })
    );

    const res = await cancel(order);

    expect(res.status).toBe(409);
    expect(res.body.error.message).toBe(CHANGED);
    expect(await reload(order.id)).toMatchObject({ status: 'PROCESSING', payment_status: 'PAID', cancelled_at: null });
    expect(await historyOf(order.id)).toHaveLength(0);
  });

  it('a customer can still cancel an unpaid transfer order, and one whose payment was rejected', async () => {
    for (const payment_status of ['PENDING', 'FAILED']) {
      const order = await createOrderRecord(ctx, { payment_status });
      const res = await cancel(order);
      expect(res.status).toBe(200);
      expect(await reload(order.id)).toMatchObject({ status: 'CANCELLED', payment_status });
    }
  });
});

describe('approval approves the proof the admin saw (fix 2)', () => {
  let ctx;
  let admin;
  beforeEach(async () => {
    ctx = await createContext();
    admin = await createUser({ role: 'ADMIN' });
  });

  it('approves when the proof sent equals the stored one', async () => {
    const order = await createOrderRecord(ctx, { payment_proof_url: PROOF });
    const res = await approveAs(admin, order.id, { payment_proof_url: PROOF });
    expect(res.status).toBe(200);
    expect(await reload(order.id)).toMatchObject({ payment_status: 'PAID', status: 'PROCESSING', payment_proof_url: PROOF });
  });

  it('still approves without a proof in the body (unchanged)', async () => {
    const order = await createOrderRecord(ctx, { payment_proof_url: PROOF });
    expect((await approveAs(admin, order.id)).status).toBe(200);
  });

  it('rejects with 409 when the stored proof is not the one the admin saw; nothing changes', async () => {
    const order = await createOrderRecord(ctx, { payment_proof_url: 'https://cdn.test/franco-sport/payment-proofs/new.png' });
    const before = await reload(order.id);

    const res = await approveAs(admin, order.id, { payment_proof_url: PROOF });

    expect(res.status).toBe(409);
    expect(res.body.error.message).toBe(PROOF_CHANGED);
    expect(await reload(order.id)).toEqual(before);
    expect(await historyOf(order.id)).toHaveLength(0);
  });

  it('rejects a body proof that is not a string', async () => {
    const order = await createOrderRecord(ctx, { payment_proof_url: PROOF });
    const res = await approveAs(admin, order.id, { payment_proof_url: { a: 1 } });
    expect(res.status).toBe(400);
    expect((await reload(order.id)).payment_status).toBe('PENDING');
  });

  it('a proof swapped between the admin check and the claim loses with 409 (even without the body proof)', async () => {
    const order = await createOrderRecord(ctx, { payment_proof_url: PROOF });
    staleNextRead(() =>
      prisma.order.update({ where: { id: order.id }, data: { payment_proof_url: 'https://cdn.test/franco-sport/payment-proofs/swap.png' } })
    );

    const res = await approveAs(admin, order.id, { payment_proof_url: PROOF });

    expect(res.status).toBe(409);
    expect(res.body.error.message).toBe(PROOF_CHANGED);
    expect(await reload(order.id)).toMatchObject({ payment_status: 'PENDING', status: 'PENDING' });
    expect(await historyOf(order.id)).toHaveLength(0);
  });
});

describe('replacing a proof deletes the previous image (fix 3)', () => {
  let ctx;
  beforeEach(async () => {
    ctx = await createContext();
  });

  it('deletes the previous project image after the new proof is saved', async () => {
    const order = await createOrderRecord(ctx, { payment_proof_url: 'https://res.cloudinary.com/demo/image/upload/v123/franco-sport/payment-proofs/old.png' });
    const res = await proof(order.id, ctx.token);
    expect(res.status).toBe(200);
    await vi.waitFor(() => expect(storage.deleteStoredImage).toHaveBeenCalledWith('franco-sport/payment-proofs/old'));
    expect(storage.deleteStoredImage).toHaveBeenCalledTimes(1);
    expect((await reload(order.id)).payment_proof_url).toMatch(/payment-proofs\/v-\d+\.png$/);
  });

  it('never deletes an image outside the project folder', async () => {
    for (const url of ['https://example.com/other-account/old.png', 'https://res.cloudinary.com/demo/image/upload/v1/otra-carpeta/old.png', 'https://cdn.test/franco-sport/../x/old.png']) {
      const order = await createOrderRecord(ctx, { payment_proof_url: url });
      expect((await proof(order.id, ctx.token)).status).toBe(200);
    }
    expect(storage.deleteStoredImage).not.toHaveBeenCalled();
  });

  it('does not delete anything for a first proof', async () => {
    const order = await createOrderRecord(ctx);
    expect((await proof(order.id, ctx.token)).status).toBe(200);
    expect(storage.deleteStoredImage).not.toHaveBeenCalled();
  });

  it('a failing delete does not fail the replacement', async () => {
    storage.deleteStoredImage.mockRejectedValueOnce(new Error('cloudinary down'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const order = await createOrderRecord(ctx, { payment_proof_url: 'https://res.cloudinary.com/demo/image/upload/v1/franco-sport/payment-proofs/old.png' });
    const res = await proof(order.id, ctx.token);
    expect(res.status).toBe(200);
    await vi.waitFor(() => expect(storage.deleteStoredImage).toHaveBeenCalledTimes(1));
  });

  it('keeps the previous image when the replacement loses its claim (only the orphan new one is deleted)', async () => {
    const order = await createOrderRecord(ctx, { payment_proof_url: 'https://cdn.test/franco-sport/payment-proofs/old.png' });
    hooks.onUpload = () => prisma.order.update({ where: { id: order.id }, data: { status: 'CANCELLED' } });

    const res = await proof(order.id, ctx.token);

    expect(res.status).toBe(409);
    await vi.waitFor(() => expect(storage.deleteStoredImage).toHaveBeenCalledTimes(1));
    expect(storage.deleteStoredImage).toHaveBeenCalledWith(expect.stringMatching(/^franco-sport\/payment-proofs\/v-\d+$/));
    expect(storage.deleteStoredImage).not.toHaveBeenCalledWith('franco-sport/payment-proofs/old');
    expect((await reload(order.id)).payment_proof_url).toBe('https://cdn.test/franco-sport/payment-proofs/old.png');
  });
});

describe('multipart limits (fix 4)', () => {
  let admin;
  let ctx;
  beforeEach(async () => {
    admin = await createUser({ role: 'ADMIN' });
    ctx = await createContext();
  });

  const withManyFields = (req, count) => {
    for (let i = 0; i < count; i++) req.field(`campo${i}`, 'x');
    return req.attach('image', PNG, { filename: 'a.png', contentType: 'image/png' });
  };

  it('a request with many fields is rejected with 400 on the admin upload; nothing stored', async () => {
    const res = await withManyFields(request(app).post('/api/upload/image').set('Authorization', `Bearer ${admin.token}`), 40);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_UPLOAD');
    expect(res.body.error.message).toBe('La solicitud contiene demasiados datos');
    expect(storage.uploadImageBuffer).not.toHaveBeenCalled();
  });

  it('a request with many fields is rejected with 400 on the proof upload; order unchanged', async () => {
    const order = await createOrderRecord(ctx);
    const res = await withManyFields(request(app).post(`/api/payment/proof/${order.id}`).set('Authorization', `Bearer ${ctx.token}`), 40);
    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('La solicitud contiene demasiados datos');
    expect(storage.uploadImageBuffer).not.toHaveBeenCalled();
    expect((await reload(order.id)).payment_proof_url).toBeNull();
  });

  it('a huge text field is rejected', async () => {
    const res = await request(app)
      .post('/api/upload/image')
      .set('Authorization', `Bearer ${admin.token}`)
      .field('nota', 'x'.repeat(200 * 1024))
      .attach('image', PNG, { filename: 'a.png', contentType: 'image/png' });
    expect(res.status).toBe(400);
    expect(storage.uploadImageBuffer).not.toHaveBeenCalled();
  });

  it('a normal upload with a couple of small fields still works', async () => {
    const res = await request(app)
      .post('/api/upload/image')
      .set('Authorization', `Bearer ${admin.token}`)
      .field('alt', 'foto')
      .attach('image', PNG, { filename: 'a.png', contentType: 'image/png' });
    expect(res.status).toBe(200);
  });
});

describe('S2 probes', () => {
  let admin;
  let customer;
  beforeEach(async () => {
    admin = await createUser({ role: 'ADMIN' });
    customer = await createUser();
  });

  it('a png header followed by html passes the magic check but is re-encoded by storage (accepted, stored via the adapter)', async () => {
    const buf = Buffer.concat([PNG.subarray(0, 8), Buffer.from('<html><script>alert(1)</script></html>')]);
    const res = await api.upload('/api/upload/image', admin.token, 'image', [{ buffer: buf, filename: 'p.png', contentType: 'image/png' }]);
    expect(res.status).toBe(200);
    expect(storage.uploadImageBuffer).toHaveBeenCalledTimes(1);
  });

  it('svg declared as image/png is rejected by content; svg mime is rejected by type', async () => {
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
    const a = await api.upload('/api/upload/image', admin.token, 'image', [{ buffer: svg, filename: 'x.png', contentType: 'image/png' }]);
    const b = await api.upload('/api/upload/image', admin.token, 'image', [{ buffer: svg, filename: 'x.svg', contentType: 'image/svg+xml' }]);
    expect([a.status, a.body.error.code, b.status, b.body.error.code]).toEqual([400, 'INVALID_IMAGE', 400, 'INVALID_FILE_TYPE']);
    expect(storage.uploadImageBuffer).not.toHaveBeenCalled();
  });

  it('two files on /image and six on /images are rejected and nothing is stored', async () => {
    const a = await api.upload('/api/upload/image', admin.token, 'image', [images.png(), images.png()]);
    const b = await api.upload('/api/upload/images', admin.token, 'images', Array.from({ length: 6 }, () => images.png()));
    expect(a.status).toBe(400);
    expect(a.body.error.code).toBe('INVALID_UPLOAD');
    expect(b.status).toBe(400);
    expect(b.body.error.code).toBe('INVALID_UPLOAD');
    expect(storage.uploadImageBuffer).not.toHaveBeenCalled();
  });

  it('one bad file among valid ones on /images stores nothing', async () => {
    const res = await api.upload('/api/upload/images', admin.token, 'images', [images.png(), images.fakePng()]);
    expect(res.status).toBe(400);
    expect(storage.uploadImageBuffer).not.toHaveBeenCalled();
  });

  it.each([
    'franco-sport/..', 'franco-sport/a/..', 'franco-sport/.', 'franco-sport', 'franco-sport/', 'franco-sport/x/',
    'franco-sport%2F..%2Fother', '%2e%2e/franco-sport/x', 'franco-sport/%252e%252e/x', 'franco-sport/x%00', 'Franco-Sport/x',
    '/franco-sport/x', 'franco-sport\\..\\x',
  ])('delete rejects %s and deletes nothing', async (publicId) => {
    const res = await api.delete(`/api/upload/image/${publicId}`, admin.token);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_PUBLIC_ID');
    expect(storage.deleteStoredImage).not.toHaveBeenCalled();
  });

  it('delete accepts a nested project public id', async () => {
    const res = await api.delete('/api/upload/image/franco-sport/payment-proofs/a/b', admin.token);
    expect(res.status).toBe(200);
    expect(storage.deleteStoredImage).toHaveBeenCalledWith('franco-sport/payment-proofs/a/b');
  });

  it.each([
    ['post', '/api/admin/brands'], ['put', '/api/admin/brands/1'], ['post', '/api/admin/categories'], ['put', '/api/admin/categories/1'],
    ['post', '/api/admin/community'], ['put', '/api/admin/community/1'], ['post', '/api/admin/marketing/send'], ['put', '/api/admin/payment/config'],
  ])('customer %s %s with a file gets 403', async (method, path) => {
    const res = await request(app)[method](path)
      .set('Authorization', `Bearer ${customer.token}`)
      .attach('image', PNG, { filename: 'a.png', contentType: 'image/png' })
      .attach('qr_code', PNG, { filename: 'a.png', contentType: 'image/png' });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });
});

describe('S3 probes', () => {
  let ctx;
  let admin;
  beforeEach(async () => {
    ctx = await createContext();
    admin = await createUser({ role: 'ADMIN' });
  });

  it('a non-numeric id answers like a missing order', async () => {
    const a = await proof('abc', ctx.token);
    const b = await proof(999999999, ctx.token);
    expect(a.status).toBe(404);
    expect(a.body).toEqual(b.body);
  });

  it('orders whose status is PAID, DELIVERED or REFUNDED are rejected and nothing is stored', async () => {
    for (const status of ['PAID', 'DELIVERED', 'REFUNDED']) {
      const order = await createOrderRecord(ctx, { status });
      const before = await reload(order.id);
      const res = await proof(order.id, ctx.token);
      expect(res.status).toBe(400);
      expect(await reload(order.id)).toEqual(before);
    }
    expect(storage.uploadImageBuffer).not.toHaveBeenCalled();
  });

  it('lost claim: cancelled during the upload -> 409, orphan image deleted, order unchanged', async () => {
    const order = await createOrderRecord(ctx);
    hooks.onUpload = () => prisma.order.update({ where: { id: order.id }, data: { status: 'CANCELLED' } });

    const res = await proof(order.id, ctx.token);

    expect(res.status).toBe(409);
    expect(res.body.error.message).toBe(CHANGED);
    await vi.waitFor(() =>
      expect(storage.deleteStoredImage).toHaveBeenCalledWith(expect.stringMatching(/^franco-sport\/payment-proofs\//))
    );
    expect((await reload(order.id)).payment_proof_url).toBeNull();
    expect(await historyOf(order.id)).toHaveLength(0);
  });

  it('lost claim: approved during the replacement -> 409, proof not overwritten, orphan deleted', async () => {
    const order = await createOrderRecord(ctx, { payment_proof_url: 'https://cdn.test/a.png' });
    hooks.onUpload = async () => {
      expect((await approveAs(admin, order.id)).status).toBe(200);
    };

    const res = await proof(order.id, ctx.token);

    expect(res.status).toBe(409);
    expect(await reload(order.id)).toMatchObject({ payment_status: 'PAID', payment_proof_url: 'https://cdn.test/a.png' });
    await vi.waitFor(() =>
      expect(storage.deleteStoredImage).toHaveBeenCalledWith(expect.stringMatching(/^franco-sport\/payment-proofs\//))
    );
    expect(storage.deleteStoredImage).toHaveBeenCalledTimes(1);
  });

  it('the rate limit is not reset by X-Forwarded-For and counts rejected attempts', async () => {
    const order = await createOrderRecord(ctx, { payment_method: 'CASH_ON_DELIVERY' });
    const attempt = (ip) =>
      request(app)
        .post(`/api/payment/proof/${order.id}`)
        .set('Authorization', `Bearer ${ctx.token}`)
        .set('X-Forwarded-For', ip)
        .attach('image', PNG, { filename: 'a.png', contentType: 'image/png' });
    for (let i = 0; i < 10; i++) expect((await attempt(`10.0.0.${i}`)).status).toBe(400);
    expect((await attempt('10.9.9.9')).status).toBe(429);
  });
});

describe('S4 probes', () => {
  let ctx;
  let admin;
  beforeEach(async () => {
    ctx = await createContext();
    admin = await createUser({ role: 'ADMIN' });
  });

  it('a non-numeric id answers 404', async () => {
    expect((await approveAs(admin, 'abc')).status).toBe(404);
  });

  it('order status PAID or DELIVERED with a pending payment is not approved', async () => {
    for (const status of ['PAID', 'DELIVERED']) {
      const order = await createOrderRecord(ctx, { status, payment_proof_url: PROOF });
      const before = await reload(order.id);
      const res = await approveAs(admin, order.id);
      expect(res.status).toBe(400);
      expect(await reload(order.id)).toEqual(before);
    }
  });

  it('rejected payment -> new proof -> approvable', async () => {
    const order = await createOrderRecord(ctx, { payment_status: 'FAILED', payment_proof_url: 'https://cdn.test/old.png' });
    expect((await proof(order.id, ctx.token)).status).toBe(200);
    expect((await approveAs(admin, order.id)).status).toBe(200);
  });

  it('the admin status PATCH never marks the payment as PAID', async () => {
    const order = await createOrderRecord(ctx);
    await api.patch(`/api/admin/orders/${order.order_number}/status`, admin.token, { status: 'PAID', payment_status: 'PAID' });
    expect((await reload(order.id)).payment_status).toBe('PENDING');
  });

  it('approve -> customer cancel: the payment stays PAID and the order is not cancelled', async () => {
    const order = await createOrderRecord(ctx, { payment_proof_url: PROOF });
    expect((await approveAs(admin, order.id)).status).toBe(200);

    const res = await api.post(`/api/orders/${order.order_number}/cancel`, ctx.token, { reason: 'x' });

    expect(res.status).toBe(400);
    expect(await reload(order.id)).toMatchObject({ status: 'PROCESSING', payment_status: 'PAID' });
  });
});
