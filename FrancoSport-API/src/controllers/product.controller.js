/**
 * Product Controller
 * Franco Sport E-Commerce
 */

import prisma from '../utils/prisma.js';

/**
 * Get all products with filters
 * GET /api/products
 */
export const getProducts = async (req, res, next) => {
  try {
    const {
      search,
      category_id,
      brand_id,
      min_price,
      max_price,
      in_stock,
      is_featured,
      sort_by = 'newest',
      page = 1,
      limit = 12,
    } = req.query;

    // Build where clause
    const where = {
      is_active: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { sku: { contains: search } },
      ];
    }

    if (category_id) {
      where.category_id = parseInt(category_id);
    }

    if (brand_id) {
      where.brand_id = parseInt(brand_id);
    }

    if (min_price || max_price) {
      where.price = {};
      if (min_price) where.price.gte = parseFloat(min_price);
      if (max_price) where.price.lte = parseFloat(max_price);
    }

    if (in_stock === 'true') {
      where.stock = { gt: 0 };
    }

    if (is_featured === 'true') {
      where.is_featured = true;
    }

    // Build orderBy
    let orderBy = { created_at: 'desc' }; // Default: newest

    switch (sort_by) {
      case 'price_asc':
        orderBy = { price: 'asc' };
        break;
      case 'price_desc':
        orderBy = { price: 'desc' };
        break;
      case 'name_asc':
        orderBy = { name: 'asc' };
        break;
      case 'name_desc':
        orderBy = { name: 'desc' };
        break;
      case 'newest':
        orderBy = { created_at: 'desc' };
        break;
      case 'oldest':
        orderBy = { created_at: 'asc' };
        break;
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get products
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          brand: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          images: {
            orderBy: {
              display_order: 'asc',
            },
          },
          reviews: {
            select: {
              rating: true,
            },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    // Calculate average rating for each product
    const productsWithRating = products.map((product) => {
      const avgRating =
        product.reviews.length > 0
          ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
          : 0;

      const { reviews, ...productData } = product;

      return {
        ...productData,
        avg_rating: Math.round(avgRating * 10) / 10,
        reviews_count: reviews.length,
      };
    });

    // Pagination info
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: productsWithRating,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        total_pages: totalPages,
        has_next: pageNum < totalPages,
        has_prev: pageNum > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single product by slug
 * GET /api/products/:slug
 */
export const getProductBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        brand: true,
        images: {
          orderBy: {
            display_order: 'asc',
          },
        },
        variants: {
          where: { is_active: true },
        },
        reviews: {
          where: { is_approved: true },
          include: {
            user: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
              },
            },
          },
          orderBy: {
            created_at: 'desc',
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!product || !product.is_active) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: 'Producto no encontrado',
        },
      });
    }

    // Calculate average rating
    const avgRating =
      product.reviews.length > 0
        ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
        : 0;

    res.json({
      success: true,
      data: {
        ...product,
        avg_rating: Math.round(avgRating * 10) / 10,
        reviews_count: product.reviews.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all categories
 * GET /api/products/categories
 */
export const getCategories = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      where: { is_active: true },
      orderBy: { display_order: 'asc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    const categoriesWithCount = categories.map((cat) => ({
      ...cat,
      products_count: cat._count.products,
    }));

    res.json({
      success: true,
      data: categoriesWithCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all brands
 * GET /api/products/brands
 */
export const getBrands = async (req, res, next) => {
  try {
    const brands = await prisma.brand.findMany({
      where: { is_active: true },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    const brandsWithCount = brands.map((brand) => ({
      ...brand,
      products_count: brand._count.products,
    }));

    res.json({
      success: true,
      data: brandsWithCount,
    });
  } catch (error) {
    next(error);
  }
};
