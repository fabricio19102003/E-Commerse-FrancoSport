import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/utils/prisma.js';
import { generateToken } from '../src/utils/jwt.js';

export { app, prisma };

let counter = 0;
const unique = () => `${Date.now().toString(36)}${(counter++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export const api = {
  post: (path, token, body) => {
    const req = request(app).post(path);
    if (token) req.set('Authorization', `Bearer ${token}`);
    return req.send(body);
  },
  patch: (path, token, body) => request(app).patch(path).set('Authorization', `Bearer ${token}`).send(body),
  get: (path, token) => {
    const req = request(app).get(path);
    if (token) req.set('Authorization', `Bearer ${token}`);
    return req;
  },
};

export const createUser = async ({ points = 0, role = 'CUSTOMER' } = {}) => {
  const id = unique();
  const user = await prisma.user.create({
    data: {
      email: `user-${id}@test.local`,
      password_hash: 'not-a-real-hash',
      first_name: 'Test',
      last_name: 'User',
      role,
      loyalty_points: points,
    },
  });
  const token = generateToken({ id: user.id, email: user.email, role: user.role });
  return { user, token };
};

export const createAddress = (userId) =>
  prisma.address.create({
    data: {
      user_id: userId,
      address_type: 'SHIPPING',
      full_name: 'Test User',
      street_address: 'Calle 1',
      city: 'La Paz',
      state: 'La Paz',
      postal_code: '0000',
      country: 'BO',
      phone: '70000000',
    },
  });

let catalog;
const getCatalog = async () => {
  if (!catalog) {
    const id = unique();
    catalog = {
      category: await prisma.category.create({ data: { name: `Cat ${id}`, slug: `cat-${id}` } }),
      brand: await prisma.brand.create({ data: { name: `Brand ${id}`, slug: `brand-${id}` } }),
    };
  }
  return catalog;
};

export const createProduct = async ({ price = '10.00', stock = 10, weight = '0', is_active = true } = {}) => {
  const { category, brand } = await getCatalog();
  const id = unique();
  return prisma.product.create({
    data: {
      name: `Producto ${id}`,
      slug: `producto-${id}`,
      description: 'Producto de prueba',
      price,
      sku: `SKU-${id}`,
      stock,
      weight,
      is_active,
      category_id: category.id,
      brand_id: brand.id,
    },
  });
};

export const createVariant = (productId, { price = null, stock = 10, is_active = true } = {}) => {
  const id = unique();
  return prisma.productVariant.create({
    data: {
      product_id: productId,
      variant_name: `Talla ${id}`,
      sku: `VAR-${id}`,
      price,
      stock,
      attributes: { size: 'M' },
      is_active,
    },
  });
};

export const createShippingMethod = async ({
  base_cost = '5.00',
  cost_per_kg = '2.00',
  is_active = true,
  zone_active = true,
} = {}) => {
  const zone = await prisma.shippingZone.create({
    data: { name: `Zona ${unique()}`, countries: ['BO'], is_active: zone_active },
  });
  return prisma.shippingMethod.create({
    data: {
      name: `Envío ${unique()}`,
      description: 'Envío de prueba',
      base_cost,
      cost_per_kg,
      estimated_days_min: 1,
      estimated_days_max: 3,
      is_active,
      shipping_zone_id: zone.id,
    },
  });
};

/**
 * A customer with an address, a product (price 10.00, stock 10, no weight),
 * and an active shipping method (base 5.00, 2.00 per kg).
 */
export const createContext = async ({ points = 0, product: productOpts, method: methodOpts } = {}) => {
  const { user, token } = await createUser({ points });
  const address = await createAddress(user.id);
  const product = await createProduct(productOpts);
  const method = await createShippingMethod(methodOpts);
  return { user, token, address, product, method };
};

export const orderBody = (ctx, overrides = {}) => ({
  items: [{ product_id: ctx.product.id, quantity: 2 }],
  shipping_address_id: ctx.address.id,
  shipping_method_id: ctx.method.id,
  payment_method: 'CASH_ON_DELIVERY',
  ...overrides,
});

export const createOrderViaApi = (ctx, overrides) => api.post('/api/orders', ctx.token, orderBody(ctx, overrides));

/**
 * Everything an order request may change, for "rejected requests change nothing" checks
 */
export const snapshot = async ({ userIds = [], productIds = [], variantIds = [] }) => {
  const [orders, orderItems, loyalty, users, products, variants] = await Promise.all([
    prisma.order.count({ where: { user_id: { in: userIds } } }),
    prisma.orderItem.count({ where: { order: { user_id: { in: userIds } } } }),
    prisma.loyaltyTransaction.count({ where: { user_id: { in: userIds } } }),
    prisma.user.findMany({ where: { id: { in: userIds } }, orderBy: { id: 'asc' }, select: { id: true, loyalty_points: true } }),
    prisma.product.findMany({ where: { id: { in: productIds } }, orderBy: { id: 'asc' }, select: { id: true, stock: true } }),
    prisma.productVariant.findMany({ where: { id: { in: variantIds } }, orderBy: { id: 'asc' }, select: { id: true, stock: true } }),
  ]);
  return { orders, orderItems, loyalty, users, products, variants };
};

export const snapshotOf = (ctx, extra = {}) =>
  snapshot({
    userIds: [ctx.user.id, ...(extra.userIds ?? [])],
    productIds: [ctx.product.id, ...(extra.productIds ?? [])],
    variantIds: extra.variantIds ?? [],
  });
