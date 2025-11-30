/**
 * Admin Orders Controller
 * Franco Sport API
 * 
 * Gestión administrativa de pedidos
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get all orders (admin view)
 * GET /api/admin/orders
 */
export const getOrders = async (req, res, next) => {
  try {
    const { status, payment_status, search, page = 1, limit = 20 } = req.query;

    // Build filters
    const where = {};

    if (status) where.status = status;
    if (payment_status) where.payment_status = payment_status;

    if (search) {
      where.OR = [
        { order_number: { contains: search } },
        { user: { email: { contains: search } } },
        { user: { first_name: { contains: search } } },
        { user: { last_name: { contains: search } } },
      ];
    }

    // Get total count
    const total = await prisma.order.count({ where });

    // Get orders
    const orders = await prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        shipping_address: true,
        shipping_method: true,
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
      },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
      orderBy: { created_at: 'desc' },
    });

    // Format response
    const formattedOrders = orders.map((order) => ({
      ...order,
      customer: {
        name: `${order.user.first_name} ${order.user.last_name}`,
        email: order.user.email,
      },
      itemsCount: order.items.length,
      user: undefined,
    }));

    res.json({
      success: true,
      data: formattedOrders,
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
 * Get single order (admin view)
 * GET /api/admin/orders/:orderNumber
 */
export const getOrder = async (req, res, next) => {
  try {
    const { orderNumber } = req.params;

    const order = await prisma.order.findUnique({
      where: { order_number: orderNumber },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone: true,
          },
        },
        shipping_address: true,
        shipping_method: true,
        coupon: true,
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
        status_history: {
          orderBy: { created_at: 'desc' },
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

    // Format response
    const formattedOrder = {
      ...order,
      customer: {
        name: `${order.user.first_name} ${order.user.last_name}`,
        email: order.user.email,
        phone: order.user.phone,
      },
      user: undefined,
    };

    res.json({
      success: true,
      data: formattedOrder,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update order status
 * PATCH /api/admin/orders/:orderNumber/status
 */
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { orderNumber } = req.params;
    const { status, tracking_number, notes } = req.body;

    const order = await prisma.order.findUnique({
      where: { order_number: orderNumber },
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

    // Update data
    const updateData = {
      status,
      updated_at: new Date(),
    };

    // Set timestamps based on status
    if (status === 'SHIPPED') {
      updateData.shipped_at = new Date();
      if (tracking_number) {
        updateData.tracking_number = tracking_number;
      }
    } else if (status === 'DELIVERED') {
      updateData.delivered_at = new Date();
    } else if (status === 'CANCELLED') {
      updateData.cancelled_at = new Date();
      if (notes) {
        updateData.cancelled_reason = notes;
      }
    }

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { order_number: orderNumber },
      data: updateData,
    });

    // Create status history entry
    await prisma.orderStatusHistory.create({
      data: {
        order_id: order.id,
        status,
        notes: notes || `Estado cambiado a ${status}`,
        created_by: req.user.id,
      },
    });

    // TODO: Send email notification to customer

    res.json({
      success: true,
      data: updatedOrder,
      message: 'Estado del pedido actualizado exitosamente',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add tracking number
 * PATCH /api/admin/orders/:orderNumber/tracking
 */
export const addTrackingNumber = async (req, res, next) => {
  try {
    const { orderNumber } = req.params;
    const { tracking_number } = req.body;

    const order = await prisma.order.update({
      where: { order_number: orderNumber },
      data: {
        tracking_number,
        updated_at: new Date(),
      },
    });

    res.json({
      success: true,
      data: order,
      message: 'Número de seguimiento agregado exitosamente',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get order statistics
 * GET /api/admin/orders/stats
 */
export const getOrderStats = async (req, res, next) => {
  try {
    const [totalOrders, pendingOrders, processingOrders, shippedOrders, deliveredOrders, cancelledOrders] =
      await Promise.all([
        prisma.order.count(),
        prisma.order.count({ where: { status: 'PENDING' } }),
        prisma.order.count({ where: { status: 'PROCESSING' } }),
        prisma.order.count({ where: { status: 'SHIPPED' } }),
        prisma.order.count({ where: { status: 'DELIVERED' } }),
        prisma.order.count({ where: { status: 'CANCELLED' } }),
      ]);

    // Calculate total revenue
    const paidOrders = await prisma.order.findMany({
      where: { payment_status: 'PAID' },
      select: { total_amount: true },
    });

    const totalRevenue = paidOrders.reduce((sum, order) => sum + parseFloat(order.total_amount), 0);

    res.json({
      success: true,
      data: {
        totalOrders,
        totalRevenue,
        pending: pendingOrders,
        processing: processingOrders,
        shipped: shippedOrders,
        delivered: deliveredOrders,
        cancelled: cancelledOrders,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel order (admin action)
 * POST /api/admin/orders/:orderNumber/cancel
 */
export const cancelOrder = async (req, res, next) => {
  try {
    const { orderNumber } = req.params;
    const { reason } = req.body;

    const order = await prisma.order.findUnique({
      where: { order_number: orderNumber },
      include: { items: true },
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

    // Check if order can be cancelled
    if (!['PENDING', 'PROCESSING'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CANNOT_CANCEL_ORDER',
          message: 'El pedido no puede ser cancelado en su estado actual',
        },
      });
    }

    // Return stock
    for (const item of order.items) {
      if (item.variant_id) {
        await prisma.productVariant.update({
          where: { id: item.variant_id },
          data: { stock: { increment: item.quantity } },
        });
      } else {
        await prisma.product.update({
          where: { id: item.product_id },
          data: { stock: { increment: item.quantity } },
        });
      }
    }

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { order_number: orderNumber },
      data: {
        status: 'CANCELLED',
        payment_status: order.payment_status === 'PAID' ? 'REFUNDED' : order.payment_status,
        cancelled_at: new Date(),
        cancelled_reason: reason,
      },
    });

    // Create status history entry
    await prisma.orderStatusHistory.create({
      data: {
        order_id: order.id,
        status: 'CANCELLED',
        notes: `Cancelado por administrador. Razón: ${reason}`,
        created_by: req.user.id,
      },
    });

    res.json({
      success: true,
      data: updatedOrder,
      message: 'Pedido cancelado exitosamente',
    });
  } catch (error) {
    next(error);
  }
};
