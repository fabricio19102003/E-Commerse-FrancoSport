import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app, prisma, createUser, createContext, createOrderViaApi } from './helpers.js';

const DAY = 24 * 60 * 60 * 1000;
let admin;
let customer;
let counter = 0;

beforeAll(async () => {
  admin = await createUser({ role: 'ADMIN' });
  customer = await createUser();
});

const call = (method, path, token, body) => {
  const req = request(app)[method](path);
  if (token) req.set('Authorization', `Bearer ${token}`);
  return body === undefined ? req : req.send(body);
};
const adminCall = (method, path, body) => call(method, path, admin.token, body);

const code = (prefix = 'AD') => `${prefix}${Date.now().toString(36)}${(counter++).toString(36)}`.toUpperCase();

const validBody = (overrides = {}) => ({
  code: code(),
  description: 'Descuento de prueba',
  discount_type: 'PERCENTAGE',
  discount_value: 10,
  minimum_purchase_amount: 20,
  maximum_discount_amount: 15,
  usage_limit_total: 100,
  usage_limit_per_user: 2,
  starts_at: new Date(Date.now() - DAY).toISOString(),
  expires_at: new Date(Date.now() + DAY).toISOString(),
  is_active: true,
  ...overrides,
});

const create = (overrides) => adminCall('post', '/api/admin/coupons', validBody(overrides));

const expectInvalid = (res, field, message) => {
  expect(res.status).toBe(400);
  expect(res.body.success).toBe(false);
  expect(res.body.error.code).toBe('VALIDATION_ERROR');
  expect(res.body.error.details).toContainEqual({ field, message });
};

const countCoupons = () => prisma.coupon.count();

describe('POST /api/admin/coupons (S5)', () => {
  it('creates a coupon with the Prisma Coupon fields and the code uppercased', async () => {
    const body = validBody({ code: `  ${code('lo')}`.toLowerCase() });
    const res = await adminCall('post', '/api/admin/coupons', body);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Cupón creado exitosamente');
    const stored = await prisma.coupon.findUnique({ where: { id: res.body.data.id } });
    expect(stored.code).toBe(body.code.trim().toUpperCase());
    expect(res.body.data).toMatchObject({
      code: stored.code,
      description: 'Descuento de prueba',
      discount_type: 'PERCENTAGE',
      discount_value: '10',
      minimum_purchase_amount: '20',
      maximum_discount_amount: '15',
      usage_limit_total: 100,
      usage_limit_per_user: 2,
      times_used: 0,
      is_active: true,
    });
    expect(new Date(res.body.data.starts_at).toISOString()).toBe(body.starts_at);
    expect(new Date(res.body.data.expires_at).toISOString()).toBe(body.expires_at);
  });

  it('optional limits default to none and the coupon to active', async () => {
    const res = await adminCall('post', '/api/admin/coupons', {
      code: code(),
      description: 'Mínimo',
      discount_type: 'FIXED_AMOUNT',
      discount_value: '5.50',
      starts_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + DAY).toISOString(),
    });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      discount_type: 'FIXED_AMOUNT',
      discount_value: '5.5',
      minimum_purchase_amount: null,
      maximum_discount_amount: null,
      usage_limit_total: null,
      usage_limit_per_user: null,
      is_active: true,
    });
  });

  it('rejects a duplicate code (case-insensitive) with 409 and stores nothing', async () => {
    const first = await create();
    const before = await countCoupons();

    const res = await create({ code: first.body.data.code.toLowerCase() });

    expect(res.status).toBe(409);
    expect(res.body).toEqual({ success: false, error: { code: 'DUPLICATE_CODE', message: 'El código de cupón ya existe' } });
    expect(await countCoupons()).toBe(before);
  });

  it.each([
    ['missing code', { code: undefined }, 'code', 'El código es requerido'],
    ['short code', { code: 'AB' }, 'code', 'El código debe tener entre 3 y 50 caracteres'],
    ['long code', { code: 'A'.repeat(51) }, 'code', 'El código debe tener entre 3 y 50 caracteres'],
    ['code with symbols', { code: 'VERANO 24!' }, 'code', 'El código solo puede contener letras y números'],
    ['missing description', { description: undefined }, 'description', 'La descripción es requerida'],
    ['blank description', { description: '   ' }, 'description', 'La descripción es requerida'],
    ['unknown type', { discount_type: 'FIXED' }, 'discount_type', 'Tipo de descuento inválido'],
    ['free shipping type', { discount_type: 'FREE_SHIPPING' }, 'discount_type', 'Tipo de descuento inválido'],
    ['zero value', { discount_value: 0 }, 'discount_value', 'El valor del descuento debe ser mayor a 0'],
    ['negative value', { discount_value: -5 }, 'discount_value', 'El valor del descuento debe ser mayor a 0'],
    ['non numeric value', { discount_value: 'mucho' }, 'discount_value', 'El valor del descuento debe ser mayor a 0'],
    ['three decimals', { discount_value: 1.234 }, 'discount_value', 'El valor del descuento admite hasta 2 decimales'],
    ['percentage over 100', { discount_value: 100.5 }, 'discount_value', 'El porcentaje de descuento no puede ser mayor a 100'],
    ['negative minimum purchase', { minimum_purchase_amount: -1 }, 'minimum_purchase_amount', 'La compra mínima debe ser un monto mayor o igual a 0 (máximo 2 decimales)'],
    ['zero maximum discount', { maximum_discount_amount: 0 }, 'maximum_discount_amount', 'El descuento máximo debe ser mayor a 0 (máximo 2 decimales)'],
    ['zero total limit', { usage_limit_total: 0 }, 'usage_limit_total', 'El límite total de usos debe ser un número entero mayor a 0'],
    ['fractional total limit', { usage_limit_total: 1.5 }, 'usage_limit_total', 'El límite total de usos debe ser un número entero mayor a 0'],
    ['zero per-user limit', { usage_limit_per_user: 0 }, 'usage_limit_per_user', 'El límite de usos por cliente debe ser un número entero mayor a 0'],
    ['missing start', { starts_at: undefined }, 'starts_at', 'Fecha de inicio inválida'],
    ['invalid start', { starts_at: 'mañana' }, 'starts_at', 'Fecha de inicio inválida'],
    ['invalid expiry', { expires_at: 'nunca' }, 'expires_at', 'Fecha de vencimiento inválida'],
    ['non boolean status', { is_active: 'si' }, 'is_active', 'El estado debe ser verdadero o falso'],
  ])('rejects %s with Spanish message and stores nothing', async (_name, overrides, field, message) => {
    const before = await countCoupons();

    expectInvalid(await create(overrides), field, message);

    expect(await countCoupons()).toBe(before);
  });

  it('accepts a fixed amount above 100 and exactly 100 percent', async () => {
    expect((await create({ discount_type: 'FIXED_AMOUNT', discount_value: 150 })).status).toBe(201);
    expect((await create({ discount_value: 100 })).status).toBe(201);
  });

  it('rejects an expiry that is not after the start', async () => {
    const at = new Date(Date.now() + DAY).toISOString();
    const before = await countCoupons();

    expectInvalid(
      await create({ starts_at: at, expires_at: at }),
      'expires_at',
      'La fecha de vencimiento debe ser posterior a la fecha de inicio'
    );
    expect(await countCoupons()).toBe(before);
  });

  it('ignores the old field names that do not exist in the schema', async () => {
    const res = await create({ min_purchase_amount: 99, start_date: 'x', usage_limit: 3 });

    expect(res.status).toBe(201);
    expect(res.body.data.minimum_purchase_amount).toBe('20');
    expect(res.body.data.min_purchase_amount).toBeUndefined();
  });
});

describe('PUT /api/admin/coupons/:id (S5)', () => {
  it('replaces the editable fields and keeps times_used', async () => {
    const created = await create();
    const id = created.body.data.id;
    await prisma.coupon.update({ where: { id }, data: { times_used: 4 } });

    const res = await adminCall(
      'put',
      `/api/admin/coupons/${id}`,
      validBody({
        code: created.body.data.code,
        description: 'Nueva descripción',
        discount_type: 'FIXED_AMOUNT',
        discount_value: 7.5,
        minimum_purchase_amount: null,
        maximum_discount_amount: null,
        usage_limit_total: 50,
        usage_limit_per_user: null,
        is_active: false,
      })
    );

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Cupón actualizado exitosamente');
    expect(res.body.data).toMatchObject({
      id,
      description: 'Nueva descripción',
      discount_type: 'FIXED_AMOUNT',
      discount_value: '7.5',
      minimum_purchase_amount: null,
      maximum_discount_amount: null,
      usage_limit_total: 50,
      usage_limit_per_user: null,
      times_used: 4,
      is_active: false,
    });
  });

  it('can rename to a free code and rejects another coupon code with 409, changing nothing', async () => {
    const a = (await create()).body.data;
    const b = (await create()).body.data;

    const renamed = await adminCall('put', `/api/admin/coupons/${a.id}`, validBody({ code: code('NEW') }));
    expect(renamed.status).toBe(200);

    const res = await adminCall('put', `/api/admin/coupons/${b.id}`, validBody({ code: renamed.body.data.code.toLowerCase() }));
    expect(res.status).toBe(409);
    expect(res.body).toEqual({ success: false, error: { code: 'DUPLICATE_CODE', message: 'El código de cupón ya existe' } });
    expect((await prisma.coupon.findUnique({ where: { id: b.id } })).code).toBe(b.code);
  });

  it('keeping its own code is not a duplicate', async () => {
    const a = (await create()).body.data;

    const res = await adminCall('put', `/api/admin/coupons/${a.id}`, validBody({ code: a.code.toLowerCase(), description: 'Otra' }));

    expect(res.status).toBe(200);
    expect(res.body.data.code).toBe(a.code);
  });

  it('applies the same validation and leaves the coupon unchanged', async () => {
    const a = (await create()).body.data;

    expectInvalid(
      await adminCall('put', `/api/admin/coupons/${a.id}`, validBody({ code: a.code, discount_value: 150 })),
      'discount_value',
      'El porcentaje de descuento no puede ser mayor a 100'
    );
    expect((await prisma.coupon.findUnique({ where: { id: a.id } })).discount_value.toString()).toBe('10');
  });

  it('answers 404 for an unknown coupon and 400 for a bad id', async () => {
    const missing = await adminCall('put', '/api/admin/coupons/99999999', validBody());
    expect(missing.status).toBe(404);
    expect(missing.body).toEqual({ success: false, error: { code: 'COUPON_NOT_FOUND', message: 'Cupón no encontrado' } });

    expectInvalid(await adminCall('put', '/api/admin/coupons/abc', validBody()), 'id', 'ID de cupón inválido');
  });
});

describe('GET /api/admin/coupons (S5)', () => {
  it('lists coupons newest first with the Prisma fields and pagination', async () => {
    const mine = (await create()).body.data;

    const res = await adminCall('get', '/api/admin/coupons?limit=5');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeLessThanOrEqual(5);
    expect(res.body.data[0].id).toBe(mine.id);
    expect(res.body.data[0]).toHaveProperty('usage_limit_total');
    expect(res.body.pagination).toMatchObject({ page: 1, limit: 5 });
    expect(res.body.pagination.total).toBe(await countCoupons());
  });

  it('filters by code (any case) and by status', async () => {
    const active = (await create()).body.data;
    const inactive = (await create({ is_active: false })).body.data;

    const byCode = await adminCall('get', `/api/admin/coupons?search=${active.code.toLowerCase()}`);
    expect(byCode.body.data.map((c) => c.id)).toEqual([active.id]);

    const off = await adminCall('get', `/api/admin/coupons?search=${inactive.code}&is_active=false`);
    expect(off.body.data.map((c) => c.id)).toEqual([inactive.id]);
    const on = await adminCall('get', `/api/admin/coupons?search=${inactive.code}&is_active=true`);
    expect(on.body.data).toEqual([]);
  });

  it('gets one coupon by id and answers 404 for an unknown one', async () => {
    const mine = (await create()).body.data;

    expect((await adminCall('get', `/api/admin/coupons/${mine.id}`)).body.data.code).toBe(mine.code);
    expect((await adminCall('get', '/api/admin/coupons/99999999')).status).toBe(404);
  });
});

describe('DELETE and toggle (S5)', () => {
  it('deletes a never used coupon and deactivates a used one', async () => {
    const unused = (await create()).body.data;
    const used = (await create()).body.data;
    await prisma.coupon.update({ where: { id: used.id }, data: { times_used: 1 } });

    const gone = await adminCall('delete', `/api/admin/coupons/${unused.id}`);
    expect(gone.status).toBe(200);
    expect(gone.body.message).toBe('Cupón eliminado exitosamente');
    expect(await prisma.coupon.findUnique({ where: { id: unused.id } })).toBeNull();

    const kept = await adminCall('delete', `/api/admin/coupons/${used.id}`);
    expect(kept.status).toBe(200);
    expect(kept.body.message).toBe('Cupón desactivado (no se puede eliminar porque ya ha sido usado)');
    expect((await prisma.coupon.findUnique({ where: { id: used.id } })).is_active).toBe(false);
  });

  it('deactivates instead of failing when the coupon is on a cancelled order (times_used back to 0)', async () => {
    const coupon = (await create()).body.data;
    const ctx = await createContext();
    await prisma.order.create({
      data: {
        order_number: `T-${code('DEL')}`,
        user_id: ctx.user.id,
        status: 'CANCELLED',
        payment_status: 'PENDING',
        payment_method: 'BANK_TRANSFER',
        subtotal: '20.00',
        shipping_cost: '5.00',
        tax_amount: '0.00',
        total_amount: '25.00',
        shipping_address_id: ctx.address.id,
        shipping_method_id: ctx.method.id,
        coupon_id: coupon.id,
      },
    });

    const res = await adminCall('delete', `/api/admin/coupons/${coupon.id}`);

    expect(res.status).toBe(200);
    expect((await prisma.coupon.findUnique({ where: { id: coupon.id } })).is_active).toBe(false);
  });

  it('answers 404 when deleting an unknown coupon', async () => {
    const res = await adminCall('delete', '/api/admin/coupons/99999999');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, error: { code: 'COUPON_NOT_FOUND', message: 'Cupón no encontrado' } });
  });

  it('toggles the status', async () => {
    const coupon = (await create()).body.data;

    const off = await adminCall('patch', `/api/admin/coupons/${coupon.id}/toggle-status`);
    expect(off.body.data.is_active).toBe(false);
    expect(off.body.message).toBe('Cupón desactivado exitosamente');
    const on = await adminCall('patch', `/api/admin/coupons/${coupon.id}/toggle-status`);
    expect(on.body.data.is_active).toBe(true);
  });
});

describe('admin only (S5)', () => {
  const routes = [
    ['get', '/api/admin/coupons'],
    ['get', '/api/admin/coupons/1'],
    ['post', '/api/admin/coupons'],
    ['put', '/api/admin/coupons/1'],
    ['delete', '/api/admin/coupons/1'],
    ['patch', '/api/admin/coupons/1/toggle-status'],
  ];

  it.each(routes)('%s %s: 401 without a token', async (method, path) => {
    const res = await call(method, path, null, method === 'post' || method === 'put' ? validBody() : undefined);
    expect(res.status).toBe(401);
  });

  it.each(routes)('%s %s: 403 for a customer, nothing stored', async (method, path) => {
    const before = await countCoupons();
    const res = await call(method, path, customer.token, method === 'post' || method === 'put' ? validBody() : undefined);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Acceso denegado. Se requieren permisos de administrador.' },
    });
    expect(await countCoupons()).toBe(before);
  });
});

describe('a coupon created through the admin API at checkout (S5)', () => {
  it('is usable: lowercase code, discount stored on the order, times_used incremented', async () => {
    const ctx = await createContext({ product: { price: '10.00', stock: 10 } });
    const created = await create({
      discount_value: 25,
      minimum_purchase_amount: 10,
      maximum_discount_amount: null,
      usage_limit_per_user: 1,
    });
    const coupon = created.body.data;

    const order = await createOrderViaApi(ctx, { coupon_code: coupon.code.toLowerCase() });

    expect(order.status).toBe(201);
    expect(Number(order.body.data.subtotal)).toBe(20);
    expect(Number(order.body.data.discount_amount)).toBe(5);
    const stored = await prisma.order.findUnique({ where: { id: order.body.data.id } });
    expect(stored.coupon_id).toBe(coupon.id);
    expect((await prisma.coupon.findUnique({ where: { id: coupon.id } })).times_used).toBe(1);
  });
});
