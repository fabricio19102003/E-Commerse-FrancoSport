/**
 * Admin Products Controller
 * Franco Sport API
 * 
 * Gestión administrativa de productos
 */

import prisma from '../../utils/prisma.js';

/**
 * Get all products (admin view - includes inactive)
 * GET /api/admin/products
 */
export const getProducts = async (req, res, next) => {
  try {
    const {
      search,
      category_id,
      brand_id,
      is_active,
      is_featured,
      in_stock,
      page = 1,
      limit = 20,
    } = req.query;

    // Build filters
    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (category_id) where.category_id = parseInt(category_id);
    if (brand_id) where.brand_id = parseInt(brand_id);
    if (is_active !== undefined) where.is_active = is_active === 'true';
    if (is_featured !== undefined) where.is_featured = is_featured === 'true';
    if (in_stock === 'true') where.stock = { gt: 0 };

    // Get total count
    const total = await prisma.product.count({ where });

    // Get products
    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        brand: true,
        images: {
          orderBy: { display_order: 'asc' },
        },
        reviews: {
          where: { is_approved: true },
          select: { rating: true },
        },
      },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
      orderBy: { created_at: 'desc' },
    });

    // Calculate ratings
    const productsWithRatings = products.map((product) => {
      const avg_rating =
        product.reviews.length > 0
          ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
          : 0;

      return {
        ...product,
        avg_rating: parseFloat(avg_rating.toFixed(1)),
        reviews_count: product.reviews.length,
        reviews: undefined,
      };
    });

    res.json({
      success: true,
      data: productsWithRatings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        total_pages: Math.ceil(total / parseInt(limit)),
        has_next: parseInt(page) < Math.ceil(total / parseInt(limit)),
        has_prev: parseInt(page) > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single product by ID (admin)
 * GET /api/admin/products/:id
 */
export const getProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: {
        category: true,
        brand: true,
        images: {
          orderBy: { display_order: 'asc' },
        },
        variants: true,
        tags: {
          include: { tag: true },
        },
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: 'Producto no encontrado',
        },
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new product
 * POST /api/admin/products
 */
export const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      slug,
      short_description,
      description,
      price,
      compare_at_price,
      cost_price,
      sku,
      barcode,
      stock,
      low_stock_threshold,
      weight,
      category_id,
      brand_id,
      is_featured,
      is_active,
      meta_title,
      meta_description,
      images,
    } = req.body;

    // Verify SKU is unique
    const existingSku = await prisma.product.findUnique({
      where: { sku },
    });

    if (existingSku) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'DUPLICATE_SKU',
          message: 'El SKU ya existe',
        },
      });
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        name,
        slug,
        short_description,
        description,
        price: parseFloat(price),
        compare_at_price: compare_at_price ? parseFloat(compare_at_price) : null,
        cost_price: parseFloat(cost_price),
        sku,
        barcode,
        stock: parseInt(stock),
        low_stock_threshold: parseInt(low_stock_threshold),
        weight: parseFloat(weight),
        category_id: parseInt(category_id),
        brand_id: parseInt(brand_id),
        is_featured: is_featured === true,
        is_active: is_active === true,
        meta_title,
        meta_description,
        images: images
          ? {
              create: images.map((img, index) => ({
                url: img.url,
                is_primary: img.is_primary || false,
                display_order: img.display_order || index,
                alt_text: img.alt_text || name,
              })),
            }
          : undefined,
      },
      include: {
        category: true,
        brand: true,
        images: true,
      },
    });

    res.status(201).json({
      success: true,
      data: product,
      message: 'Producto creado exitosamente',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update product
 * PUT /api/admin/products/:id
 */
export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Whitelist allowed update fields — never spread raw req.body into Prisma
    const ALLOWED_FIELDS = [
      'name', 'slug', 'short_description', 'description',
      'price', 'compare_at_price', 'cost_price', 'sku', 'barcode',
      'stock', 'low_stock_threshold', 'weight',
      'category_id', 'brand_id',
      'is_featured', 'is_active',
      'meta_title', 'meta_description',
    ];

    const images = req.body.images;
    const productData = {};
    for (const field of ALLOWED_FIELDS) {
      if (req.body[field] !== undefined) {
        productData[field] = req.body[field];
      }
    }

    // Convert numeric fields
    if (productData.price != null) productData.price = parseFloat(productData.price);
    if (productData.compare_at_price != null)
      productData.compare_at_price = parseFloat(productData.compare_at_price);
    if (productData.cost_price != null) productData.cost_price = parseFloat(productData.cost_price);
    if (productData.stock != null) productData.stock = parseInt(productData.stock);
    if (productData.low_stock_threshold != null)
      productData.low_stock_threshold = parseInt(productData.low_stock_threshold);
    if (productData.weight != null) productData.weight = parseFloat(productData.weight);
    if (productData.category_id != null) productData.category_id = parseInt(productData.category_id);
    if (productData.brand_id != null) productData.brand_id = parseInt(productData.brand_id);

    const product = await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        ...productData,
        images: images
          ? {
              deleteMany: {},
              create: images.map((img, index) => ({
                url: img.url,
                is_primary: img.is_primary || false,
                display_order: img.display_order || index,
                alt_text: img.alt_text || productData.name,
              })),
            }
          : undefined,
      },
      include: {
        category: true,
        brand: true,
        images: true,
      },
    });

    res.json({
      success: true,
      data: product,
      message: 'Producto actualizado exitosamente',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete product (soft delete)
 * DELETE /api/admin/products/:id
 */
export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if product has active orders
    const activeOrders = await prisma.orderItem.count({
      where: {
        product_id: parseInt(id),
        order: {
          status: {
            in: ['PENDING', 'PROCESSING', 'PAID', 'SHIPPED'],
          },
        },
      },
    });

    if (activeOrders > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'PRODUCT_HAS_ACTIVE_ORDERS',
          message: 'No se puede eliminar un producto con pedidos activos',
        },
      });
    }

    // Soft delete (mark as inactive)
    await prisma.product.update({
      where: { id: parseInt(id) },
      data: { is_active: false },
    });

    res.json({
      success: true,
      message: 'Producto eliminado exitosamente',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle product active status
 * PATCH /api/admin/products/:id/toggle-status
 */
export const toggleProductStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
    });

    const updatedProduct = await prisma.product.update({
      where: { id: parseInt(id) },
      data: { is_active: !product.is_active },
      include: {
        category: true,
        brand: true,
        images: true,
      },
    });

    res.json({
      success: true,
      data: updatedProduct,
      message: `Producto ${updatedProduct.is_active ? 'activado' : 'desactivado'} exitosamente`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get products with low stock
 * GET /api/admin/products/low-stock
 */
export const getLowStockProducts = async (req, res, next) => {
  try {
    // Prisma doesn't support cross-field comparison (stock <= low_stock_threshold)
    // in where clauses. Use raw query to find IDs, then fetch with Prisma includes.
    const lowStockIds = await prisma.$queryRaw`
      SELECT id FROM products
      WHERE is_active = true
        AND stock <= low_stock_threshold
        AND stock > 0
      ORDER BY stock ASC
    `;

    const ids = lowStockIds.map((row) => row.id);

    const products = ids.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: ids } },
          include: {
            category: true,
            brand: true,
            images: {
              where: { is_primary: true },
              take: 1,
            },
          },
          orderBy: { stock: 'asc' },
        })
      : [];

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};
