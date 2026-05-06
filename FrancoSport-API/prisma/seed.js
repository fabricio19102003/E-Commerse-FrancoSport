/**
 * Database Seed
 * Franco Sport E-Commerce
 * "No es suerte, es esfuerzo"
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

  const product1 = await prisma.product.create({
    data: {
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
    },
  });

  await prisma.productImage.create({
    data: {
      product_id: product1.id,
      url: 'https://images.unsplash.com/photo-1577212017184-80cc3c0bcb85?auto=format&fit=crop&q=80&w=800',
      alt_text: 'Edición Limitada Carbono',
      is_primary: true,
      display_order: 1,
    },
  });

  const product2 = await prisma.product.create({
    data: {
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
    },
  });

  await prisma.productImage.create({
    data: {
      product_id: product2.id,
      url: 'https://images.unsplash.com/photo-1620799140408-ed5341cd2431?auto=format&fit=crop&q=80&w=800',
      alt_text: 'Red Racing Beast',
      is_primary: true,
      display_order: 1,
    },
  });

  const product3 = await prisma.product.create({
    data: {
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
    },
  });

  await prisma.productImage.create({
    data: {
      product_id: product3.id,
      url: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&q=80&w=800',
      alt_text: 'White Cross Series',
      is_primary: true,
      display_order: 1,
    },
  });

  const product4 = await prisma.product.create({
    data: {
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
    },
  });

  await prisma.productImage.create({
    data: {
      product_id: product4.id,
      url: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?auto=format&fit=crop&q=80&w=800',
      alt_text: 'Polo Promo 86',
      is_primary: true,
      display_order: 1,
    },
  });

  console.log('✅ Productos creados');

  // ===== SHIPPING =====
  console.log('\n🚚 Configurando envíos...');

  const shippingZone = await prisma.shippingZone.create({
    data: {
      name: 'Bolivia',
      countries: ['BO'],
      is_active: true,
    },
  });

  await prisma.shippingMethod.createMany({
    data: [
      {
        name: 'Envío Estándar',
        description: 'Entrega en 3-5 días hábiles',
        base_cost: 20.0,
        cost_per_kg: 5.0,
        estimated_days_min: 3,
        estimated_days_max: 5,
        is_active: true,
        shipping_zone_id: shippingZone.id,
      },
      {
        name: 'Envío Express',
        description: 'Entrega en 1-2 días hábiles',
        base_cost: 40.0,
        cost_per_kg: 10.0,
        estimated_days_min: 1,
        estimated_days_max: 2,
        is_active: true,
        shipping_zone_id: shippingZone.id,
      },
    ],
  });

  console.log('✅ Métodos de envío configurados');

  // ===== COUPONS =====
  console.log('\n🎟️  Creando cupones...');

  // Use dynamic future dates so seeded coupons are always valid
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

  await prisma.coupon.createMany({
    data: [
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
        description: 'Envío gratis en compras mayores a $200',
        discount_type: 'FREE_SHIPPING',
        discount_value: 0,
        minimum_purchase_amount: 200,
        starts_at: new Date(),
        expires_at: oneYearFromNow,
        is_active: true,
      },
    ],
  });

  console.log('✅ Cupones creados');

  console.log('\nSeed completado exitosamente!\n');
  console.log('Credenciales de prueba:');
  console.log('   Admin: admin@francosport.com / <SEED_ADMIN_PASSWORD>');
  console.log('   Cliente: cliente@francosport.com / <SEED_USER_PASSWORD>\n');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
