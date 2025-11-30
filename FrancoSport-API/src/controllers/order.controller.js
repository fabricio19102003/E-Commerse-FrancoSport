/**
 * Order Controller
 * Franco Sport E-Commerce
 */

import prisma from '../utils/prisma.js';

/**
 * Get user's orders
 * GET /api/orders
 */
export const getOrders = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    const where = { user_id: userId };

    if (status) {
      where.status = status;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  where: { is_primary: true },
                  take: 1,
                },
              },
            },
          },
        },
        shipping_address: true,
        shipping_method: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single order
 * GET /api/orders/:orderNumber
 */
export const getOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { orderNumber } = req.params;

    const order = await prisma.order.findUnique({
      where: { order_number: orderNumber },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  where: { is_primary: true },
                  take: 1,
                },
              },
            },
            variant: true,
          },
        },
        shipping_address: true,
        shipping_method: true,
        status_history: {
          orderBy: {
            created_at: 'desc',
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Pedido no encontrado',
        },
      });
    }

    // Verify order belongs to user (unless admin)
    if (order.user_id !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'No tienes acceso a este pedido',
        },
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel order
 * POST /api/orders/:orderNumber/cancel
 */
export const cancelOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { orderNumber } = req.params;
    const { reason } = req.body;

    const order = await prisma.order.findUnique({
      where: { order_number: orderNumber },
      include: {
        items: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Pedido no encontrado',
        },
      });
    }

    // Verify order belongs to user
    if (order.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'No tienes acceso a este pedido',
        },
      });
    }

    // Check if order can be cancelled
    if (!['PENDING', 'PROCESSING'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CANNOT_CANCEL',
          message: 'Este pedido no puede ser cancelado',
        },
      });
    }

    // Update order status
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'CANCELLED',
        cancelled_at: new Date(),
        cancelled_reason: reason,
      },
    });

    // Return stock
    for (const item of order.items) {
      if (item.variant_id) {
        await prisma.productVariant.update({
          where: { id: item.variant_id },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });
      } else {
        await prisma.product.update({
          where: { id: item.product_id },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });
      }
    }

    // Add status history
    await prisma.orderStatusHistory.create({
      data: {
        order_id: order.id,
        status: 'CANCELLED',
        notes: reason,
      },
    });

    res.json({
      success: true,
      message: 'Pedido cancelado exitosamente',
    });
  } catch (error) {
    next(error);
  }
};
