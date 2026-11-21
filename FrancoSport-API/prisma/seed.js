/**
 * Database Seed
 * Franco Sport E-Commerce
 * "No es suerte, es esfuerzo"
 *
 * Idempotent: every record is looked up by its natural key and created only when it is
 * missing, so running it again never fails, never duplicates data and never overwrites
 * what the owner changed (passwords, stock, prices, coupon usage, payment details).
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed de la base de datos...\n');

  const isProduction = process.env.NODE_ENV === 'production';

  // ===== USERS =====
  console.log('Creando usuarios...');

  const adminRawPassword = process.env.SEED_ADMIN_PASSWORD || (isProduction ? null : 'admin123');
  const userRawPassword = process.env.SEED_USER_PASSWORD || (isProduction ? null : 'user123');

  if (isProduction && (!adminRawPassword || !userRawPassword)) {
    throw new Error(
      'SEED_ADMIN_PASSWORD and SEED_USER_PASSWORD must be set via environment variables in production.'
    );
  }

  const adminPassword = await bcrypt.hash(adminRawPassword, 12);
  const userPassword = await bcrypt.hash(userRawPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@francosport.com' },
    update: {},
    create: {
      email: 'admin@francosport.com',
      password_hash: adminPassword,
      first_name: 'Pedro',
      last_name: 'Admin',
      phone: '+591 70000000',
      role: 'ADMIN',
      email_verified: true,
      is_active: true,
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: 'cliente@francosport.com' },
    update: {},
    create: {
      email: 'cliente@francosport.com',
      password_hash: userPassword,
      first_name: 'Cliente',
      last_name: 'Fiel',
      phone: '+591 71111111',
      role: 'CUSTOMER',
      email_verified: true,
      is_active: true,
    },
  });

  console.log('✅ Usuarios creados');

  // ===== CATEGORIES =====
  console.log('\n📂 Creando categorías...');

  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'elite' },
      update: {},
      create: {
        name: 'Elite',
        slug: 'elite',
        description: 'Colección premium de alto rendimiento',
        display_order: 1,
        is_active: true,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'pro' },
      update: {},
      create: {
        name: 'Pro',
        slug: 'pro',
        description: 'Equipamiento profesional',
        display_order: 2,
        is_active: true,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'sport' },
      update: {},
      create: {
        name: 'Sport',
        slug: 'sport',
        description: 'Línea deportiva casual',
        display_order: 3,
        is_active: true,
      },
    }),
  ]);

  console.log('✅ Categorías creadas');

  // ===== BRANDS =====
  console.log('\n🏷️  Creando marcas...');

  const brands = await Promise.all([
    prisma.brand.upsert({
      where: { slug: 'franco-sport' },
      update: {},
      create: {
        name: 'Franco Sport',
        slug: 'franco-sport',
        description: 'Marca insignia',
        is_active: true,
      },
    }),
    prisma.brand.upsert({
      where: { slug: 'racing-elite' },
      update: {},
      create: {
        name: 'Racing Elite',
        slug: 'racing-elite',
        description: 'Alto rendimiento',
        is_active: true,
      },
    }),
    prisma.brand.upsert({
      where: { slug: 'legacy' },
      update: {},
      create: {
        name: 'Legacy',
        slug: 'legacy',
        description: 'Tradición y calidad',
        is_active: true,
      },
    }),
  ]);

  console.log('✅ Marcas creadas');

  // ===== PRODUCTS =====
  console.log('\n📦 Creando productos...');

  // Product and image are created together, and only when the product (by sku) is missing,
  // so a re-run never adds a second image nor resets stock or price changed from the panel.
  const ensureProduct = async ({ imageUrl, ...data }) => {
    const existing = await prisma.product.findUnique({ where: { sku: data.sku } });
    if (existing) return existing;
    return prisma.product.create({
      data: {
        ...data,
        images: {
          create: { url: imageUrl, alt_text: data.name, is_primary: true, display_order: 1 },
        },
      },
    });
  };

  await ensureProduct({
    name: 'Edición Limitada Carbono',
    slug: 'edicion-limitada-carbono',
    short_description: 'Diseño aerodinámico premium',
    description:
      'Camiseta de edición limitada con diseño aerodinámico en escala de grises. Fabricada con tecnología de carbono para máximo rendimiento. "No es suerte, es esfuerzo".',
    price: 180.0,
    compare_at_price: 220.0,
    cost_price: 90.0,
    sku: 'ELC-001',
    stock: 15,
    low_stock_threshold: 5,
    weight: 0.3,
    category_id: categories[0].id,
    brand_id: brands[0].id,
    is_featured: true,
    is_active: true,
    meta_title: 'Camiseta Edición Limitada Carbono - Franco Sport',
    meta_description: 'Diseño premium con tecnología de carbono',
    imageUrl:
      'https://images.unsplash.com/photo-1577212017184-80cc3c0bcb85?auto=format&fit=crop&q=80&w=800',
  });

  await ensureProduct({
    name: 'Red Racing Beast',
    slug: 'red-racing-beast',
    short_description: 'Geometría agresiva para competición',
    description:
      'Diseño de alto rendimiento en tonos rojos vibrantes. Geometría agresiva para dominar la pista. Tecnología de última generación.',
    price: 165.0,
    cost_price: 80.0,
    sku: 'RRB-002',
    stock: 8,
    low_stock_threshold: 5,
    weight: 0.3,
    category_id: categories[0].id,
    brand_id: brands[1].id,
    is_featured: true,
    is_active: true,
    imageUrl:
      'https://images.unsplash.com/photo-1620799140408-ed5341cd2431?auto=format&fit=crop&q=80&w=800',
  });

  await ensureProduct({
    name: 'White Cross Series',
    slug: 'white-cross-series',
    short_description: 'Elegancia y rendimiento',
    description:
      'Serie especial con detalles en negro y rojo sobre base blanca. Combina elegancia con alto rendimiento deportivo.',
    price: 150.0,
    cost_price: 75.0,
    sku: 'WCS-003',
    stock: 12,
    low_stock_threshold: 5,
    weight: 0.3,
    category_id: categories[1].id,
    brand_id: brands[0].id,
    is_featured: false,
    is_active: true,
    imageUrl:
      'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&q=80&w=800',
  });

  await ensureProduct({
    name: 'Polo Promo 86',
    slug: 'polo-promo-86',
    short_description: 'La elegancia del legado',
    description:
      'Polo clásico con mensaje inspirador "Vivir, estudiar, triunfar". Diseño atemporal que representa la excelencia académica y deportiva.',
    price: 120.0,
    cost_price: 60.0,
    sku: 'PP86-004',
    stock: 25,
    low_stock_threshold: 10,
    weight: 0.25,
    category_id: categories[2].id,
    brand_id: brands[2].id,
    is_featured: false,
    is_active: true,
    imageUrl:
      'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?auto=format&fit=crop&q=80&w=800',
  });

  console.log('✅ Productos creados');

  // ===== SHIPPING =====
  console.log('\n🚚 Configurando envíos...');

  // Zones and methods have no unique column: look them up by name before creating
  const shippingZone =
    (await prisma.shippingZone.findFirst({ where: { name: 'Bolivia' } })) ??
    (await prisma.shippingZone.create({
      data: {
        name: 'Bolivia',
        countries: ['BO'],
        is_active: true,
      },
    }));

  const shippingMethods = [
    {
      name: 'Envío Estándar',
      description: 'Entrega en 3-5 días hábiles',
      base_cost: 20.0,
      cost_per_kg: 5.0,
      estimated_days_min: 3,
      estimated_days_max: 5,
      is_active: true,
    },
    {
      name: 'Envío Express',
      description: 'Entrega en 1-2 días hábiles',
      base_cost: 40.0,
      cost_per_kg: 10.0,
      estimated_days_min: 1,
      estimated_days_max: 2,
      is_active: true,
    },
  ];

  for (const method of shippingMethods) {
    const existing = await prisma.shippingMethod.findFirst({
      where: { name: method.name, shipping_zone_id: shippingZone.id },
    });
    if (!existing) {
      await prisma.shippingMethod.create({ data: { ...method, shipping_zone_id: shippingZone.id } });
    }
  }

  console.log('✅ Métodos de envío configurados');

  // ===== COUPONS =====
  console.log('\n🎟️  Creando cupones...');

  // Use dynamic future dates so seeded coupons are always valid
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

  const coupons = [
    {
      code: 'FRANCO20',
      description: '20% de descuento',
      discount_type: 'PERCENTAGE',
      discount_value: 20,
      minimum_purchase_amount: 100,
      maximum_discount_amount: 50,
      starts_at: new Date(),
      expires_at: oneYearFromNow,
      is_active: true,
    },
    {
      code: 'ENVIOGRATIS',
      description: 'Envío gratis en compras mayores a Bs. 200',
      discount_type: 'FREE_SHIPPING',
      discount_value: 0,
      minimum_purchase_amount: 200,
      starts_at: new Date(),
      expires_at: oneYearFromNow,
      is_active: true,
    },
  ];

  // Upsert with `update: {}` so a re-run keeps times_used and whatever the admin edited
  for (const coupon of coupons) {
    await prisma.coupon.upsert({ where: { code: coupon.code }, update: {}, create: coupon });
  }

  console.log('✅ Cupones creados');

  // ===== PAYMENT CONFIG =====
  console.log('\n💳 Configurando pago por transferencia/QR...');

  // EXAMPLE DATA ONLY: replace the QR image and the bank details from the admin panel
  // (Pagos) before taking real payments. One config serves QR_TRANSFER and BANK_TRANSFER.
  // Upsert with `update: {}` so re-running the seed never overwrites what the admin saved.
  await prisma.paymentConfig.upsert({
    where: { method_name: 'BANK_TRANSFER' },
    update: {},
    create: {
      method_name: 'BANK_TRANSFER',
      qr_code_url: 'https://placehold.co/400x400/png?text=QR+DE+EJEMPLO',
      instructions: [
        '[DATOS DE EJEMPLO - reemplazar antes de vender]',
        'Pague con QR o transferencia bancaria y suba el comprobante en su pedido.',
        'Banco: Banco de Ejemplo S.A.',
        'Cuenta: 000-000000-0-00 (cuenta de ejemplo)',
        'Titular: Franco Sport (ejemplo)',
        'Referencia: su número de pedido',
      ].join('\n'),
      is_active: true,
    },
  });

  console.log('✅ Configuración de pago creada (datos de ejemplo)');

  console.log('\nSeed completado exitosamente!\n');
  console.log('Credenciales de prueba:');
  console.log('   Admin: admin@francosport.com / <SEED_ADMIN_PASSWORD>');
  console.log('   Cliente: cliente@francosport.com / <SEED_USER_PASSWORD>');
  console.log('   (fuera de producción, sin esas variables: admin123 / user123)\n');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
