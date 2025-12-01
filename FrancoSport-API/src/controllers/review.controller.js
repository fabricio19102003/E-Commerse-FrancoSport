/**
 * Review Controller
 * Franco Sport API
 */

import prisma from '../utils/prisma.js';

/**
 * Create a new review
 * POST /api/reviews
 */
export const createReview = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { product_id, rating, comment } = req.body;

    // Validate input
    if (!product_id || !rating) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'Producto y calificación son requeridos',
        },
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_RATING',
          message: 'La calificación debe estar entre 1 y 5',
        },
      });
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: product_id },
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

    // Check if user already reviewed this product
    const existingReview = await prisma.review.findFirst({
      where: {
        user_id: userId,
        product_id: product_id,
      },
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ALREADY_REVIEWED',
          message: 'Ya has calificado este producto',
        },
      });
    }

    // Create review (pending approval)
    const review = await prisma.review.create({
      data: {
        user_id: userId,
        product_id: product_id,
        rating: parseInt(rating),
        comment,
        is_approved: false, // Requires moderation
      },
    });

    res.status(201).json({
      success: true,
      message: 'Reseña enviada exitosamente. Estará visible después de ser aprobada.',
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get reviews for a product
 * GET /api/reviews/product/:productId
 */
export const getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const where = {
      product_id: parseInt(productId),
      is_approved: true, // Only show approved reviews
    };

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          user: {
            select: {
              first_name: true,
              last_name: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
        skip,
        take: limitNum,
      }),
      prisma.review.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: reviews,
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
