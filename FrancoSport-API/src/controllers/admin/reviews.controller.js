/**
 * Admin Reviews Controller
 * Franco Sport API
 * 
 * Gestión de moderación de reseñas
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get all reviews (admin view)
 * GET /api/admin/reviews
 */
export const getReviews = async (req, res, next) => {
  try {
    const { search, is_approved, product_id, page = 1, limit = 20 } = req.query;

    // Build filters
    const where = {};

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { comment: { contains: search } },
        { user: { first_name: { contains: search } } },
        { user: { last_name: { contains: search } } },
        { product: { name: { contains: search } } }
      ];
    }

    if (is_approved !== undefined) {
      where.is_approved = is_approved === 'true';
    }

    if (product_id) {
      where.product_id = parseInt(product_id);
    }

    // Get total count
    const total = await prisma.review.count({ where });

    // Get reviews
    const reviews = await prisma.review.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: {
              where: { is_primary: true },
              take: 1,
              select: { url: true }
            }
          }
        }
      },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
      orderBy: { created_at: 'desc' },
    });

    res.json({
      success: true,
      data: reviews,
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
 * Get single review
 * GET /api/admin/reviews/:id
 */
export const getReview = async (req, res, next) => {
  try {
    const { id } = req.params;

    const review = await prisma.review.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: {
              where: { is_primary: true },
              take: 1,
              select: { url: true }
            }
          }
        }
      }
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'REVIEW_NOT_FOUND',
          message: 'Reseña no encontrada',
        },
      });
    }

    res.json({
      success: true,
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve review
 * PATCH /api/admin/reviews/:id/approve
 */
export const approveReview = async (req, res, next) => {
  try {
    const { id } = req.params;

    const review = await prisma.review.findUnique({
      where: { id: parseInt(id) }
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'REVIEW_NOT_FOUND',
          message: 'Reseña no encontrada',
        },
      });
    }

    const updatedReview = await prisma.review.update({
      where: { id: parseInt(id) },
      data: { is_approved: true }
    });

    res.json({
      success: true,
      data: updatedReview,
      message: 'Reseña aprobada exitosamente',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete review
 * DELETE /api/admin/reviews/:id
 */
export const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;

    const review = await prisma.review.findUnique({
      where: { id: parseInt(id) }
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'REVIEW_NOT_FOUND',
          message: 'Reseña no encontrada',
        },
      });
    }

    await prisma.review.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Reseña eliminada exitosamente',
    });
  } catch (error) {
    next(error);
  }
};
