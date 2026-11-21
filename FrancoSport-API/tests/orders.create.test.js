import { describe, it, expect } from 'vitest';
import {
  api,
  prisma,
  createContext,
  createProduct,
  createVariant,
  createUser,
  createAddress,
  createShippingMethod,
  createOrderViaApi,
  orderBody,
  snapshotOf,
} from './helpers.js';

const QUANTITY_MESSAGE = 'La cantidad debe ser un número entero entre 1 y 99';
const POINTS_MESSAGE = 'Los puntos a canjear deben ser un número entero mayor o igual a 0';

const expectRejected = (res, status, code, message) => {
  expect(res.status).toBe(status);
  expect(res.body.success).toBe(false);
  expect(res.body.error.code).toBe(code);
  if (code === 'VALIDATION_ERROR') {
    expect(res.body.error.message).toBe('Error de validación');
    expect(res.body.error.details.map((d) => d.message)).toContain(message);
  } else {
    expect(res.body.error.message).toBe(message);
  }
};

describe('POST /api/orders - valid order (S2, S4, S6)', () => {
  it('creates an order with exact totals from database prices and server-side shipping', async () => {
    const ctx = await createContext({ product: { price: '10.50', stock: 10 } });

    const res = await createOrderViaApi(ctx, { items: [{ product_id: ctx.product.id, quantity: 3 }] });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Pedido creado exitosamente');
    const order = res.body.data;
    expect(order.status).toBe('PENDING');
    expect(Number(order.subtotal)).toBe(31.5);
    expect(Number(order.shipping_cost)).toBe(5);
    expect(Number(order.discount_amount)).toBe(0);
    expect(Number(order.total_amount)).toBe(36.5);
    expect(order.items).toHaveLength(1);
    expect(order.items[0].quantity).toBe(3);
    expect(Number(order.items[0].price_at_purchase)).toBe(10.5);
    expect(Number(order.items[0].subtotal)).toBe(31.5);

    const product = await prisma.product.findUnique({ where: { id: ctx.product.id } });
    expect(product.stock).toBe(7);
  });

  it('uses the product price when the variant has no price of its own', async () => {
    const ctx = await createContext({ product: { price: '12.00', stock: 10 } });
    const variant = await createVariant(ctx.product.id, { price: null, stock: 5 });

    const res = await createOrderViaApi(ctx, { items: [{ product_id: ctx.product.id, variant_id: variant.id, quantity: 2 }] });

    expect(res.status).toBe(201);
    expect(Number(res.body.data.subtotal)).toBe(24);
    expect(Number(res.body.data.items[0].price_at_purchase)).toBe(12);
    const after = await prisma.productVariant.findUnique({ where: { id: variant.id } });
    expect(after.stock).toBe(3);
    const productAfter = await prisma.product.findUnique({ where: { id: ctx.product.id } });
    expect(productAfter.stock).toBe(10);
  });

  it('uses the variant price when it has one', async () => {
    const ctx = await createContext({ product: { price: '12.00' } });
    const variant = await createVariant(ctx.product.id, { price: '15.25', stock: 5 });

    const res = await createOrderViaApi(ctx, { items: [{ product_id: ctx.product.id, variant_id: variant.id, quantity: 2 }] });

    expect(res.status).toBe(201);
    expect(Number(res.body.data.subtotal)).toBe(30.5);
  });

  it('ignores amounts sent by the client', async () => {
    const ctx = await createContext({ product: { price: '10.00' } });

    const res = await createOrderViaApi(ctx, {
      shipping_cost: 0,
      subtotal: 1,
      total_amount: 1,
      discount_amount: 999,
      tax_amount: 50,
      items: [{ product_id: ctx.product.id, quantity: 2, price: 0.01, price_at_purchase: 0.01, subtotal: 0.02 }],
    });

    expect(res.status).toBe(201);
    expect(Number(res.body.data.subtotal)).toBe(20);
    expect(Number(res.body.data.shipping_cost)).toBe(5);
    expect(Number(res.body.data.discount_amount)).toBe(0);
    expect(Number(res.body.data.tax_amount)).toBe(0);
    expect(Number(res.body.data.total_amount)).toBe(25);
    expect(Number(res.body.data.items[0].price_at_purchase)).toBe(10);
  });
});

describe('POST /api/orders - items (S2)', () => {
  const invalidQuantities = [
    ['negative', -5],
    ['zero', 0],
    ['decimal', 1.5],
    ['text', 'abc'],
    ['numeric text', '2'],
    ['above the maximum', 100],
    ['missing', undefined],
  ];

  it.each(invalidQuantities)('rejects a %s quantity and changes nothing', async (_name, quantity) => {
    const ctx = await createContext();
    const before = await snapshotOf(ctx);

    const res = await createOrderViaApi(ctx, { items: [{ product_id: ctx.product.id, quantity }] });

    expectRejected(res, 400, 'VALIDATION_ERROR', QUANTITY_MESSAGE);
    expect(res.body.error.details.find((d) => d.message === QUANTITY_MESSAGE).field).toBe('items[0].quantity');
    expect(await snapshotOf(ctx)).toEqual(before);
  });

  it.each([1, 99])('accepts the boundary quantity %i', async (quantity) => {
    const ctx = await createContext({ product: { stock: 100 } });

    const res = await createOrderViaApi(ctx, { items: [{ product_id: ctx.product.id, quantity }] });

    expect(res.status).toBe(201);
    expect(res.body.data.items[0].quantity).toBe(quantity);
  });

  it('rejects an empty items list and a missing items list', async () => {
    const ctx = await createContext();
    const before = await snapshotOf(ctx);

    expectRejected(await createOrderViaApi(ctx, { items: [] }), 400, 'VALIDATION_ERROR', 'Debe incluir al menos un producto');
    expectRejected(await createOrderViaApi(ctx, { items: undefined }), 400, 'VALIDATION_ERROR', 'Debe incluir al menos un producto');
    expect(await snapshotOf(ctx)).toEqual(before);
  });

  it('rejects more than 50 lines', async () => {
    const ctx = await createContext();
    const before = await snapshotOf(ctx);
    const items = Array.from({ length: 51 }, (_, i) => ({ product_id: ctx.product.id + i, quantity: 1 }));

    const res = await createOrderViaApi(ctx, { items });

    expectRejected(res, 400, 'VALIDATION_ERROR', 'El pedido no puede tener más de 50 productos');
    expect(await snapshotOf(ctx)).toEqual(before);
  });

  it.each([
    ['zero', 0],
    ['negative', -1],
    ['decimal', 1.5],
    ['text', 'abc'],
    ['missing', undefined],
  ])('rejects a %s product_id', async (_name, product_id) => {
    const ctx = await createContext();
    const before = await snapshotOf(ctx);

    const res = await createOrderViaApi(ctx, { items: [{ product_id, quantity: 1 }] });

    expectRejected(res, 400, 'VALIDATION_ERROR', 'ID de producto inválido');
    expect(await snapshotOf(ctx)).toEqual(before);
  });

  it.each([0, -1, 1.5, 'abc'])('rejects variant_id %s', async (variant_id) => {
    const ctx = await createContext();
    const before = await snapshotOf(ctx);

    const res = await createOrderViaApi(ctx, { items: [{ product_id: ctx.product.id, variant_id, quantity: 1 }] });

    expectRejected(res, 400, 'VALIDATION_ERROR', 'ID de variante inválido');
    expect(await snapshotOf(ctx)).toEqual(before);
  });

  it('rejects a product that does not exist', async () => {
    const ctx = await createContext();
    const before = await snapshotOf(ctx);

    const res = await createOrderViaApi(ctx, { items: [{ product_id: 999999999, quantity: 1 }] });

    expectRejected(res, 400, 'INVALID_ORDER', 'Producto no encontrado: 999999999');
    expect(await snapshotOf(ctx)).toEqual(before);
  });

  it('rejects an inactive product', async () => {
    const ctx = await createContext({ product: { is_active: false } });
    const before = await snapshotOf(ctx);

    const res = await createOrderViaApi(ctx);

    expectRejected(res, 400, 'INVALID_ORDER', `El producto ${ctx.product.name} no está disponible`);
    expect(await snapshotOf(ctx)).toEqual(before);
  });

  it('rejects a variant that does not exist', async () => {
    const ctx = await createContext();
    const before = await snapshotOf(ctx);

    const res = await createOrderViaApi(ctx, { items: [{ product_id: ctx.product.id, variant_id: 999999999, quantity: 1 }] });

    expectRejected(res, 400, 'INVALID_ORDER', 'Variante no encontrada: 999999999');
    expect(await snapshotOf(ctx)).toEqual(before);
  });

  it('rejects a variant that belongs to another product', async () => {
    const ctx = await createContext();
    const other = await createProduct();
    const foreignVariant = await createVariant(other.id, { stock: 5 });
    const before = await snapshotOf(ctx, { productIds: [other.id], variantIds: [foreignVariant.id] });

    const res = await createOrderViaApi(ctx, { items: [{ product_id: ctx.product.id, variant_id: foreignVariant.id, quantity: 1 }] });

    expectRejected(res, 400, 'INVALID_ORDER', `Variante no encontrada: ${foreignVariant.id}`);
    expect(await snapshotOf(ctx, { productIds: [other.id], variantIds: [foreignVariant.id] })).toEqual(before);
  });

  it('rejects an inactive variant', async () => {
    const ctx = await createContext();
    const variant = await createVariant(ctx.product.id, { stock: 5, is_active: false });
    const before = await snapshotOf(ctx, { variantIds: [variant.id] });

    const res = await createOrderViaApi(ctx, { items: [{ product_id: ctx.product.id, variant_id: variant.id, quantity: 1 }] });

    expectRejected(res, 400, 'INVALID_ORDER', `La variante ${variant.variant_name} no está disponible`);
    expect(await snapshotOf(ctx, { variantIds: [variant.id] })).toEqual(before);
  });

  it('rejects the same product twice and changes nothing', async () => {
    const ctx = await createContext();
    const before = await snapshotOf(ctx);

    const res = await createOrderViaApi(ctx, {
      items: [
        { product_id: ctx.product.id, quantity: 1 },
        { product_id: ctx.product.id, quantity: 2 },
      ],
    });

    expectRejected(res, 400, 'INVALID_ORDER', `Producto repetido en el pedido: ${ctx.product.id}. Combine las cantidades en una sola línea`);
    expect(await snapshotOf(ctx)).toEqual(before);
  });

  it('rejects the same variant twice', async () => {
    const ctx = await createContext();
    const variant = await createVariant(ctx.product.id, { stock: 5 });
    const before = await snapshotOf(ctx, { variantIds: [variant.id] });

    const res = await createOrderViaApi(ctx, {
      items: [
        { product_id: ctx.product.id, variant_id: variant.id, quantity: 1 },
        { product_id: ctx.product.id, variant_id: variant.id, quantity: 1 },
      ],
    });

    expectRejected(
      res,
      400,
      'INVALID_ORDER',
      `Producto repetido en el pedido: ${ctx.product.id} (variante ${variant.id}). Combine las cantidades en una sola línea`
    );
    expect(await snapshotOf(ctx, { variantIds: [variant.id] })).toEqual(before);
  });

  it('allows a product and one of its variants as different lines', async () => {
    const ctx = await createContext({ product: { stock: 5 } });
    const variant = await createVariant(ctx.product.id, { stock: 5 });

    const res = await createOrderViaApi(ctx, {
      items: [
        { product_id: ctx.product.id, quantity: 1 },
        { product_id: ctx.product.id, variant_id: variant.id, quantity: 1 },
      ],
    });

    expect(res.status).toBe(201);
    expect(res.body.data.items).toHaveLength(2);
  });

  it('rejects insufficient stock and rolls back the lines already processed', async () => {
    const ctx = await createContext({ product: { stock: 5 } });
    const scarce = await createProduct({ stock: 1 });
    const before = await snapshotOf(ctx, { productIds: [scarce.id] });

    const res = await createOrderViaApi(ctx, {
      items: [
        { product_id: ctx.product.id, quantity: 2 },
        { product_id: scarce.id, quantity: 2 },
      ],
    });

    expectRejected(res, 400, 'INVALID_ORDER', `Stock insuficiente para ${scarce.name}`);
    expect(await snapshotOf(ctx, { productIds: [scarce.id] })).toEqual(before);
  });

  it('rejects insufficient variant stock', async () => {
    const ctx = await createContext();
    const variant = await createVariant(ctx.product.id, { stock: 1 });
    const before = await snapshotOf(ctx, { variantIds: [variant.id] });

    const res = await createOrderViaApi(ctx, { items: [{ product_id: ctx.product.id, variant_id: variant.id, quantity: 2 }] });

    expectRejected(res, 400, 'INVALID_ORDER', `Stock insuficiente para ${ctx.product.name} (${variant.sku})`);
    expect(await snapshotOf(ctx, { variantIds: [variant.id] })).toEqual(before);
  });

  it('never oversells: concurrent orders for the last unit, only one succeeds', async () => {
    const product = await createProduct({ stock: 1 });
    const buyers = await Promise.all(
      Array.from({ length: 6 }, async () => {
        const { user, token } = await createUser();
        const address = await createAddress(user.id);
        return { user, token, address };
      })
    );
    const method = await createShippingMethod();

    const responses = await Promise.all(
      buyers.map((b) =>
        api.post('/api/orders', b.token, {
          items: [{ product_id: product.id, quantity: 1 }],
          shipping_address_id: b.address.id,
          shipping_method_id: method.id,
          payment_method: 'CASH_ON_DELIVERY',
        })
      )
    );

    expect(responses.filter((r) => r.status === 201)).toHaveLength(1);
    for (const r of responses.filter((r) => r.status !== 201)) {
      expectRejected(r, 400, 'INVALID_ORDER', `Stock insuficiente para ${product.name}`);
    }
    expect((await prisma.product.findUnique({ where: { id: product.id } })).stock).toBe(0);
    expect(await prisma.orderItem.count({ where: { product_id: product.id } })).toBe(1);
  });

  it('never oversells a variant under concurrent orders', async () => {
    const product = await createProduct({ stock: 10 });
    const variant = await createVariant(product.id, { stock: 2 });
    const buyers = await Promise.all(
      Array.from({ length: 5 }, async () => {
        const { user, token } = await createUser();
        return { token, address: await createAddress(user.id) };
      })
    );
    const method = await createShippingMethod();

    const responses = await Promise.all(
      buyers.map((b) =>
        api.post('/api/orders', b.token, {
          items: [{ product_id: product.id, variant_id: variant.id, quantity: 1 }],
          shipping_address_id: b.address.id,
          shipping_method_id: method.id,
          payment_method: 'CASH_ON_DELIVERY',
        })
      )
    );

    expect(responses.filter((r) => r.status === 201)).toHaveLength(2);
    expect((await prisma.productVariant.findUnique({ where: { id: variant.id } })).stock).toBe(0);
  });
});

describe('POST /api/orders - address (S3)', () => {
  it('answers the same for another customer\'s address and a nonexistent address', async () => {
    const ctx = await createContext();
    const other = await createUser();
    const foreignAddress = await createAddress(other.user.id);
    const before = await snapshotOf(ctx, { userIds: [other.user.id] });

    const foreign = await createOrderViaApi(ctx, { shipping_address_id: foreignAddress.id });
    const missing = await createOrderViaApi(ctx, { shipping_address_id: 999999999 });

    expectRejected(foreign, 400, 'INVALID_ORDER', 'Dirección de envío no encontrada');
    expect(missing.status).toBe(foreign.status);
    expect(missing.body).toEqual(foreign.body);
    expect(await snapshotOf(ctx, { userIds: [other.user.id] })).toEqual(before);
  });

  it('accepts the customer\'s own address', async () => {
    const ctx = await createContext();

    const res = await createOrderViaApi(ctx);

    expect(res.status).toBe(201);
    expect(res.body.data.shipping_address_id).toBe(ctx.address.id);
  });

  it.each([0, -1, 1.5, 'abc', undefined])('rejects shipping_address_id %s', async (shipping_address_id) => {
    const ctx = await createContext();
    const before = await snapshotOf(ctx);

    const res = await createOrderViaApi(ctx, { shipping_address_id });

    expectRejected(res, 400, 'VALIDATION_ERROR', 'Dirección de envío inválida');
    expect(await snapshotOf(ctx)).toEqual(before);
  });
});

describe('POST /api/orders - shipping (S4)', () => {
  it('charges the base cost when the products have no weight', async () => {
    const ctx = await createContext({ product: { weight: '0' }, method: { base_cost: '7.50', cost_per_kg: '3.00' } });

    const res = await createOrderViaApi(ctx);

    expect(res.status).toBe(201);
    expect(Number(res.body.data.shipping_cost)).toBe(7.5);
    expect(Number(res.body.data.total_amount)).toBe(27.5);
    expect(res.body.data.shipping_method_id).toBe(ctx.method.id);
  });

  it('adds cost per kg times the total weight (weight × quantity, all lines)', async () => {
    const ctx = await createContext({ product: { price: '10.00', weight: '1.50' }, method: { base_cost: '5.00', cost_per_kg: '2.00' } });
    const light = await createProduct({ price: '4.00', weight: '0.25' });

    const res = await createOrderViaApi(ctx, {
      items: [
        { product_id: ctx.product.id, quantity: 2 }, // 3.00 kg
        { product_id: light.id, quantity: 2 }, // 0.50 kg
      ],
    });

    expect(res.status).toBe(201);
    // 5.00 + 2.00 × 3.50 kg
    expect(Number(res.body.data.shipping_cost)).toBe(12);
    expect(Number(res.body.data.subtotal)).toBe(28);
    expect(Number(res.body.data.total_amount)).toBe(40);
  });

  it.each([
    ['inactive', { is_active: false }],
    ['in an inactive zone', { zone_active: false }],
  ])('rejects a method that is %s', async (_name, methodOpts) => {
    const ctx = await createContext({ method: methodOpts });
    const before = await snapshotOf(ctx);

    const res = await createOrderViaApi(ctx);

    expectRejected(res, 400, 'INVALID_ORDER', 'Método de envío no disponible');
    expect(await snapshotOf(ctx)).toEqual(before);
  });

  it('rejects a method that does not exist', async () => {
    const ctx = await createContext();
    const before = await snapshotOf(ctx);

    const res = await createOrderViaApi(ctx, { shipping_method_id: 999999999 });

    expectRejected(res, 400, 'INVALID_ORDER', 'Método de envío no disponible');
    expect(await snapshotOf(ctx)).toEqual(before);
  });

  it.each([0, -1, 1.5, 'abc', undefined])('rejects shipping_method_id %s', async (shipping_method_id) => {
    const ctx = await createContext();
    const before = await snapshotOf(ctx);

    const res = await createOrderViaApi(ctx, { shipping_method_id });

    expectRejected(res, 400, 'VALIDATION_ERROR', 'Método de envío inválido');
    expect(await snapshotOf(ctx)).toEqual(before);
  });
});

describe('GET /api/shipping-methods (S4)', () => {
  it('lists only active methods in active zones, without auth', async () => {
    const active = await createShippingMethod({ base_cost: '3.00' });
    const inactive = await createShippingMethod({ is_active: false });
    const inactiveZone = await createShippingMethod({ zone_active: false });

    const res = await api.get('/api/shipping-methods');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const ids = res.body.data.map((m) => m.id);
    expect(ids).toContain(active.id);
    expect(ids).not.toContain(inactive.id);
    expect(ids).not.toContain(inactiveZone.id);
    const method = res.body.data.find((m) => m.id === active.id);
    expect(Object.keys(method).sort()).toEqual(
      ['base_cost', 'cost_per_kg', 'description', 'estimated_days_max', 'estimated_days_min', 'id', 'name'].sort()
    );
    expect(Number(method.base_cost)).toBe(3);
    expect(Number(method.cost_per_kg)).toBe(2);
  });
});

describe('POST /api/orders - loyalty points (S5)', () => {
  it('deducts the redeemed points, discounts the total and records the transaction', async () => {
    const ctx = await createContext({ points: 500 });

    const res = await createOrderViaApi(ctx, { redeem_points: 300 });

    expect(res.status).toBe(201);
    expect(Number(res.body.data.discount_amount)).toBe(3);
    expect(Number(res.body.data.total_amount)).toBe(22); // 20 + 5 - 3
    expect((await prisma.user.findUnique({ where: { id: ctx.user.id } })).loyalty_points).toBe(200);
    const txs = await prisma.loyaltyTransaction.findMany({ where: { user_id: ctx.user.id } });
    expect(txs).toHaveLength(1);
    expect(txs[0]).toMatchObject({ points: -300, type: 'REDEEMED', order_id: res.body.data.id });
  });

  it('deducts only the points the order total allows', async () => {
    const ctx = await createContext({ points: 10000 });

    const res = await createOrderViaApi(ctx, { redeem_points: 5000 }); // total is 25.00 = 2500 points

    expect(res.status).toBe(201);
    expect(Number(res.body.data.discount_amount)).toBe(25);
    expect(Number(res.body.data.total_amount)).toBe(0);
    expect((await prisma.user.findUnique({ where: { id: ctx.user.id } })).loyalty_points).toBe(7500);
    const txs = await prisma.loyaltyTransaction.findMany({ where: { user_id: ctx.user.id } });
    expect(txs.map((t) => t.points)).toEqual([-2500]);
  });

  it('does nothing for redeem_points 0 or null', async () => {
    const ctx = await createContext({ points: 100 });

    const zero = await createOrderViaApi(ctx, { redeem_points: 0 });
    const nul = await createOrderViaApi(ctx, { redeem_points: null });

    expect(zero.status).toBe(201);
    expect(nul.status).toBe(201);
    expect(Number(zero.body.data.total_amount)).toBe(25);
    expect((await prisma.user.findUnique({ where: { id: ctx.user.id } })).loyalty_points).toBe(100);
    expect(await prisma.loyaltyTransaction.count({ where: { user_id: ctx.user.id } })).toBe(0);
  });

  it('rejects more points than the balance and changes nothing', async () => {
    const ctx = await createContext({ points: 100 });
    const before = await snapshotOf(ctx);

    const res = await createOrderViaApi(ctx, { redeem_points: 101 });

    expectRejected(res, 400, 'INVALID_ORDER', 'Puntos de lealtad insuficientes');
    expect(await snapshotOf(ctx)).toEqual(before);
  });

  it.each([-1, 1.5, 'abc', '100'])('rejects redeem_points %s and changes nothing', async (redeem_points) => {
    const ctx = await createContext({ points: 500 });
    const before = await snapshotOf(ctx);

    const res = await createOrderViaApi(ctx, { redeem_points });

    expectRejected(res, 400, 'VALIDATION_ERROR', POINTS_MESSAGE);
    expect(await snapshotOf(ctx)).toEqual(before);
  });

  it('cannot spend the same points twice with concurrent orders', async () => {
    const ctx = await createContext({ points: 1000, product: { stock: 10 } });

    const responses = await Promise.all([
      createOrderViaApi(ctx, { redeem_points: 800 }),
      createOrderViaApi(ctx, { redeem_points: 800 }),
      createOrderViaApi(ctx, { redeem_points: 800 }),
    ]);

    expect(responses.filter((r) => r.status === 201)).toHaveLength(1);
    for (const r of responses.filter((r) => r.status !== 201)) {
      expectRejected(r, 400, 'INVALID_ORDER', 'Puntos de lealtad insuficientes');
    }
    expect((await prisma.user.findUnique({ where: { id: ctx.user.id } })).loyalty_points).toBe(200);
    expect((await prisma.product.findUnique({ where: { id: ctx.product.id } })).stock).toBe(8);
  });
});

describe('POST /api/orders - authentication (S6 regression)', () => {
  it('still requires a token', async () => {
    const ctx = await createContext();

    const res = await api.post('/api/orders', null, orderBody(ctx));

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});
