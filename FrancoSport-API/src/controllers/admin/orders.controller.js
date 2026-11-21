/**
 * Admin Orders Controller
 * Franco Sport API
 * 
 * Gestión administrativa de pedidos
 */

import prisma from '../../utils/prisma.js';
import {
  CANCELLABLE_STATUSES,
  OrderError,
  cancelOrderInTransaction,
  reopenOrderInTransaction,
  runTransaction,
} from '../../services/order.service.js';

const sendOrderError = (res, error) =>
  res.status(error.status).json({
    success: false,
    error: {
      code: error.code,
      message: error.message,
    },
  });

const cannotCancelAdmin = (res) =>
  res.status(400).json({
    success: false,
    error: {
      code: 'CANNOT_CANCEL_ORDER',
      message: 'El pedido no puede ser cancelado en su estado actual',
    },
  });

/**
 * Get all orders (admin view)
 * GET /api/admin/orders
 */
export const getOrders = async (req, res, next) => {
  try {
    const { status, payment_status, search, page = 1, limit = 20, startDate, endDate } = req.query;

    // Build filters
    const where = {};

    if (status) where.status = status;
    if (payment_status) where.payment_status = payment_status;

    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) {
        where.created_at.gte = new Date(startDate);
      }
      if (endDate) {
        // Set to end of day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.created_at.lte = end;
      }
    }

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

    // Calculate total revenue for filtered orders
    const revenueResult = await prisma.order.aggregate({
      where: {
        ...where,
        payment_status: 'PAID' // Only count paid orders for revenue
      },
      _sum: {
        total_amount: true,
      },
    });
    const totalRevenue = revenueResult._sum.total_amount || 0;

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
      totalRevenue,
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

    // Cancelling and reopening move stock and points, so they share the cancel/reopen helpers
    if (status === 'CANCELLED') {
      if (!CANCELLABLE_STATUSES.includes(order.status)) {
        return cannotCancelAdmin(res);
      }
      const cancelled = await runTransaction(prisma, (tx) =>
        cancelOrderInTransaction(tx, order, {
          reason: notes || 'Cancelado por administrador',
          historyNotes: notes || 'Cancelado por administrador',
          createdBy: req.user.id,
          extraData: { payment_status: order.payment_status === 'PAID' ? 'REFUNDED' : order.payment_status },
        })
      );
      if (!cancelled) {
        return cannotCancelAdmin(res);
      }
      return res.json({
        success: true,
        data: cancelled,
        message: 'Estado del pedido actualizado exitosamente',
      });
    }

    if (order.status === 'CANCELLED') {
      // The only way out of CANCELLED is reopening to PENDING
      if (status !== 'PENDING') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'ORDER_CANCELLED',
            message: 'Un pedido cancelado solo puede reabrirse a estado PENDING',
          },
        });
      }
      const reopened = await runTransaction(prisma, (tx) =>
        reopenOrderInTransaction(tx, order, {
          historyNotes: notes || 'Pedido reabierto por el administrador',
          createdBy: req.user.id,
        })
      );
      return res.json({
        success: true,
        // null: another request reopened it first, nothing more was moved
        data: reopened ?? (await prisma.order.findUnique({ where: { id: order.id } })),
        message: 'Estado del pedido actualizado exitosamente',
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
    }

    // The transition is a conditional claim on the status that was read: if a
    // cancellation or another change got there first, nothing is overwritten.
    const updatedOrder = await runTransaction(prisma, async (tx) => {
      const claimed = await tx.order.updateMany({
        where: { id: order.id, status: order.status },
        data: updateData,
      });
      if (claimed.count === 0) return null;

      await tx.orderStatusHistory.create({
        data: {
          order_id: order.id,
          status,
          notes: notes || `Estado cambiado a ${status}`,
          created_by: req.user.id,
        },
      });

      // Award Loyalty Points if DELIVERED (same transaction as the claim, so exactly once)
      if (status === 'DELIVERED' && order.status !== 'DELIVERED') {
        const pointsToAward = Math.floor(Number(order.total_amount)); // 1 point per $1

        if (pointsToAward > 0) {
          await tx.user.update({
            where: { id: order.user_id },
            data: { loyalty_points: { increment: pointsToAward } },
          });

          await tx.loyaltyTransaction.create({
            data: {
              user_id: order.user_id,
              order_id: order.id,
              points: pointsToAward,
              type: 'EARNED',
              description: `Puntos ganados por pedido #${order.order_number}`,
            },
          });
        }
      }

      return tx.order.findUnique({ where: { id: order.id } });
    });

    if (!updatedOrder) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'ORDER_CHANGED',
          message: 'El pedido cambió mientras tanto; recargue e intente de nuevo',
        },
      });
    }

    // TODO: Send email notification to customer

    res.json({
      success: true,
      data: updatedOrder,
      message: 'Estado del pedido actualizado exitosamente',
    });
  } catch (error) {
    if (error instanceof OrderError) return sendOrderError(res, error);
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
    if (!CANCELLABLE_STATUSES.includes(order.status)) {
      return cannotCancelAdmin(res);
    }

    // Cancel order, restore stock and points, and record history atomically
    const updatedOrder = await runTransaction(prisma, (tx) =>
      cancelOrderInTransaction(tx, order, {
        reason,
        historyNotes: `Cancelado por administrador. Razón: ${reason}`,
        createdBy: req.user.id,
        extraData: { payment_status: order.payment_status === 'PAID' ? 'REFUNDED' : order.payment_status },
      })
    );

    if (!updatedOrder) {
      return cannotCancelAdmin(res);
    }

    res.json({
      success: true,
      data: updatedOrder,
      message: 'Pedido cancelado exitosamente',
    });
  } catch (error) {
    next(error);
  }
};
