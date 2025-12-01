/**
 * Admin Brands Controller
 * Franco Sport API
 * 
 * Gestión administrativa de marcas
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get all brands (admin view)
 * GET /api/admin/brands
 */
export const getBrands = async (req, res, next) => {
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
    const total = await prisma.brand.count({ where });

    // Get brands
    const brands = await prisma.brand.findMany({
      where,
      include: {
        _count: {
          select: { products: true }
        }
      },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
      orderBy: { name: 'asc' },
    });

    res.json({
      success: true,
      data: brands,
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
 * Get single brand
 * GET /api/admin/brands/:id
 */
export const getBrand = async (req, res, next) => {
  try {
    const { id } = req.params;

    const brand = await prisma.brand.findUnique({
      where: { id: parseInt(id) }
    });

    if (!brand) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'BRAND_NOT_FOUND',
          message: 'Marca no encontrada',
        },
      });
    }

    res.json({
      success: true,
      data: brand,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create brand
 * POST /api/admin/brands
 */
export const createBrand = async (req, res, next) => {
  try {
    const {
      name,
      slug,
      description,
      logo_url,
      website_url,
      is_active
    } = req.body;

    // Check if slug exists
    const existingSlug = await prisma.brand.findUnique({
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
    let finalLogoUrl = logo_url;
    if (req.file) {
      finalLogoUrl = req.file.path;
    }

    const brand = await prisma.brand.create({
      data: {
        name,
        slug,
        description,
        logo_url: finalLogoUrl,
        website_url,
        is_active: is_active === 'true' || is_active === true
      }
    });

    res.status(201).json({
      success: true,
      data: brand,
      message: 'Marca creada exitosamente',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update brand
 * PUT /api/admin/brands/:id
 */
export const updateBrand = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      slug,
      description,
      logo_url,
      website_url,
      is_active
    } = req.body;

    // Check if brand exists
    const existingBrand = await prisma.brand.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingBrand) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'BRAND_NOT_FOUND',
          message: 'Marca no encontrada',
        },
      });
    }

    // Check slug uniqueness if changed
    if (slug && slug !== existingBrand.slug) {
      const existingSlug = await prisma.brand.findUnique({
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

    // Handle image upload
    let finalLogoUrl = logo_url;
    if (req.file) {
      finalLogoUrl = req.file.path;
    }

    const brand = await prisma.brand.update({
      where: { id: parseInt(id) },
      data: {
        name,
        slug,
        description,
        logo_url: finalLogoUrl,
        website_url,
        is_active: is_active !== undefined ? (is_active === 'true' || is_active === true) : undefined
      }
    });

    res.json({
      success: true,
      data: brand,
      message: 'Marca actualizada exitosamente',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete brand
 * DELETE /api/admin/brands/:id
 */
export const deleteBrand = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check active products
    const activeProducts = await prisma.product.count({
      where: {
        brand_id: parseInt(id),
        is_active: true
      }
    });

    if (activeProducts > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'BRAND_HAS_PRODUCTS',
          message: 'No se puede eliminar una marca con productos activos',
        },
      });
    }

    // Hard delete
    await prisma.brand.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Marca eliminada exitosamente',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle brand status
 * PATCH /api/admin/brands/:id/toggle-status
 */
export const toggleBrandStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    const brand = await prisma.brand.findUnique({
      where: { id: parseInt(id) }
    });

    if (!brand) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'BRAND_NOT_FOUND',
          message: 'Marca no encontrada',
        },
      });
    }

    const updatedBrand = await prisma.brand.update({
      where: { id: parseInt(id) },
      data: { is_active: !brand.is_active }
    });

    res.json({
      success: true,
      data: updatedBrand,
      message: `Marca ${updatedBrand.is_active ? 'activada' : 'desactivada'} exitosamente`,
    });
  } catch (error) {
    next(error);
  }
};
