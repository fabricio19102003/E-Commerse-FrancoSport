/**
 * Admin Shipping Controller
 * Franco Sport API
 * 
 * Gestión administrativa de métodos de envío
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get all shipping methods (admin view)
 * GET /api/admin/shipping
 */
export const getShippingMethods = async (req, res, next) => {
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
    const total = await prisma.shippingMethod.count({ where });

    // Get shipping methods
    const shippingMethods = await prisma.shippingMethod.findMany({
      where,
      include: {
        shipping_zone: true
      },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
      orderBy: { base_cost: 'asc' },
    });

    res.json({
      success: true,
      data: shippingMethods,
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
 * Get single shipping method
 * GET /api/admin/shipping/:id
 */
export const getShippingMethod = async (req, res, next) => {
  try {
    const { id } = req.params;

    const shippingMethod = await prisma.shippingMethod.findUnique({
      where: { id: parseInt(id) },
      include: {
        shipping_zone: true
      }
    });

    if (!shippingMethod) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SHIPPING_METHOD_NOT_FOUND',
          message: 'Método de envío no encontrado',
        },
      });
    }

    res.json({
      success: true,
      data: shippingMethod,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create shipping method
 * POST /api/admin/shipping
 */
export const createShippingMethod = async (req, res, next) => {
  try {
    const {
      name,
      description,
      base_cost,
      cost_per_kg,
      estimated_days_min,
      estimated_days_max,
      is_active,
      shipping_zone_id
    } = req.body;

    // Default to first zone if not provided (temporary solution)
    let zoneId = shipping_zone_id;
    if (!zoneId) {
      const defaultZone = await prisma.shippingZone.findFirst();
      if (defaultZone) {
        zoneId = defaultZone.id;
      } else {
        // Create a default zone if none exists
        const newZone = await prisma.shippingZone.create({
          data: {
            name: 'Default Zone',
            countries: ['BO'],
            is_active: true
          }
        });
        zoneId = newZone.id;
      }
    }

    const shippingMethod = await prisma.shippingMethod.create({
      data: {
        name,
        description,
        base_cost: parseFloat(base_cost),
        cost_per_kg: parseFloat(cost_per_kg || 0),
        estimated_days_min: parseInt(estimated_days_min),
        estimated_days_max: parseInt(estimated_days_max),
        is_active: is_active === true,
        shipping_zone_id: parseInt(zoneId)
      }
    });

    res.status(201).json({
      success: true,
      data: shippingMethod,
      message: 'Método de envío creado exitosamente',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update shipping method
 * PUT /api/admin/shipping/:id
 */
export const updateShippingMethod = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      base_cost,
      cost_per_kg,
      estimated_days_min,
      estimated_days_max,
      is_active,
      shipping_zone_id
    } = req.body;

    // Check if exists
    const existingMethod = await prisma.shippingMethod.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingMethod) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SHIPPING_METHOD_NOT_FOUND',
          message: 'Método de envío no encontrado',
        },
      });
    }

    const shippingMethod = await prisma.shippingMethod.update({
      where: { id: parseInt(id) },
      data: {
        name,
        description,
        base_cost: base_cost !== undefined ? parseFloat(base_cost) : undefined,
        cost_per_kg: cost_per_kg !== undefined ? parseFloat(cost_per_kg) : undefined,
        estimated_days_min: estimated_days_min !== undefined ? parseInt(estimated_days_min) : undefined,
        estimated_days_max: estimated_days_max !== undefined ? parseInt(estimated_days_max) : undefined,
        is_active: is_active !== undefined ? is_active : undefined,
        shipping_zone_id: shipping_zone_id ? parseInt(shipping_zone_id) : undefined
      }
    });

    res.json({
      success: true,
      data: shippingMethod,
      message: 'Método de envío actualizado exitosamente',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete shipping method
 * DELETE /api/admin/shipping/:id
 */
export const deleteShippingMethod = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if used in orders
    const usedInOrders = await prisma.order.count({
      where: { shipping_method_id: parseInt(id) }
    });

    if (usedInOrders > 0) {
      // Soft delete
      await prisma.shippingMethod.update({
        where: { id: parseInt(id) },
        data: { is_active: false }
      });
      
      return res.json({
        success: true,
        message: 'Método de envío desactivado (no se puede eliminar porque ha sido usado en pedidos)',
      });
    }

    // Hard delete
    await prisma.shippingMethod.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Método de envío eliminado exitosamente',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle shipping method status
 * PATCH /api/admin/shipping/:id/toggle-status
 */
export const toggleShippingMethodStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    const method = await prisma.shippingMethod.findUnique({
      where: { id: parseInt(id) }
    });

    if (!method) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SHIPPING_METHOD_NOT_FOUND',
          message: 'Método de envío no encontrado',
        },
      });
    }

    const updatedMethod = await prisma.shippingMethod.update({
      where: { id: parseInt(id) },
      data: { is_active: !method.is_active }
    });

    res.json({
      success: true,
      data: updatedMethod,
      message: `Método de envío ${updatedMethod.is_active ? 'activado' : 'desactivado'} exitosamente`,
    });
  } catch (error) {
    next(error);
  }
};
