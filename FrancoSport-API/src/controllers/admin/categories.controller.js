/**
 * Admin Categories Controller
 * Franco Sport API
 * 
 * Gestión administrativa de categorías
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get all categories (admin view)
 * GET /api/admin/categories
 */
export const getCategories = async (req, res, next) => {
  try {
    const { search, is_active, page = 1, limit = 20 } = req.query;

    // Build filters
    const where = {};

    if (search) {
      where.name = { contains: search };
    }

    if (is_active !== undefined) {
      where.is_active = is_active === 'true';
    }

    // Get total count
    const total = await prisma.category.count({ where });

    // Get categories
    const categories = await prisma.category.findMany({
      where,
      include: {
        _count: {
          select: { products: true }
        },
        parent: true
      },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
      orderBy: { display_order: 'asc' },
    });

    res.json({
      success: true,
      data: categories,
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
 * Get single category
 * GET /api/admin/categories/:id
 */
export const getCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: { id: parseInt(id) },
      include: {
        parent: true,
        children: true
      }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CATEGORY_NOT_FOUND',
          message: 'Categoría no encontrada',
        },
      });
    }

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create category
 * POST /api/admin/categories
 */
export const createCategory = async (req, res, next) => {
  try {
    const {
      name,
      slug,
      description,
      image_url,
      parent_id,
      display_order,
      is_active
    } = req.body;

    // Check if slug exists
    const existingSlug = await prisma.category.findUnique({
      where: { slug }
    });

    if (existingSlug) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'DUPLICATE_SLUG',
          message: 'El slug ya existe',
        },
      });
    }

    // Handle image upload
    let finalImageUrl = image_url;
    if (req.file) {
      finalImageUrl = req.file.path;
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description,
        image_url: finalImageUrl,
        parent_id: parent_id ? parseInt(parent_id) : null,
        display_order: display_order ? parseInt(display_order) : 0,
        is_active: is_active === 'true' || is_active === true
      }
    });

    res.status(201).json({
      success: true,
      data: category,
      message: 'Categoría creada exitosamente',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update category
 * PUT /api/admin/categories/:id
 */
export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      slug,
      description,
      image_url,
      parent_id,
      display_order,
      is_active
    } = req.body;

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CATEGORY_NOT_FOUND',
          message: 'Categoría no encontrada',
        },
      });
    }

    // Check slug uniqueness if changed
    if (slug && slug !== existingCategory.slug) {
      const existingSlug = await prisma.category.findUnique({
        where: { slug }
      });

      if (existingSlug) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'DUPLICATE_SLUG',
            message: 'El slug ya existe',
          },
        });
      }
    }

    // Prevent circular parent reference
    if (parent_id && parseInt(parent_id) === parseInt(id)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARENT',
          message: 'Una categoría no puede ser su propio padre',
        },
      });
    }

    // Handle image upload
    let finalImageUrl = image_url;
    if (req.file) {
      finalImageUrl = req.file.path;
    }

    const category = await prisma.category.update({
      where: { id: parseInt(id) },
      data: {
        name,
        slug,
        description,
        image_url: finalImageUrl,
        parent_id: parent_id ? parseInt(parent_id) : null,
        display_order: display_order ? parseInt(display_order) : undefined,
        is_active: is_active !== undefined ? (is_active === 'true' || is_active === true) : undefined
      }
    });

    res.json({
      success: true,
      data: category,
      message: 'Categoría actualizada exitosamente',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete category
 * DELETE /api/admin/categories/:id
 */
export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check active products
    const activeProducts = await prisma.product.count({
      where: {
        category_id: parseInt(id),
        is_active: true
      }
    });

    if (activeProducts > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CATEGORY_HAS_PRODUCTS',
          message: 'No se puede eliminar una categoría con productos activos',
        },
      });
    }

    // Check children categories
    const children = await prisma.category.count({
      where: { parent_id: parseInt(id) }
    });

    if (children > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CATEGORY_HAS_CHILDREN',
          message: 'No se puede eliminar una categoría que tiene subcategorías',
        },
      });
    }

    // Hard delete since it's just a taxonomy
    await prisma.category.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Categoría eliminada exitosamente',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle category status
 * PATCH /api/admin/categories/:id/toggle-status
 */
export const toggleCategoryStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: { id: parseInt(id) }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CATEGORY_NOT_FOUND',
          message: 'Categoría no encontrada',
        },
      });
    }

    const updatedCategory = await prisma.category.update({
      where: { id: parseInt(id) },
      data: { is_active: !category.is_active }
    });

    res.json({
      success: true,
      data: updatedCategory,
      message: `Categoría ${updatedCategory.is_active ? 'activada' : 'desactivada'} exitosamente`,
    });
  } catch (error) {
    next(error);
  }
};
