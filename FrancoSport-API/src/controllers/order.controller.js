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

/**
 * Create order
 * POST /api/orders
 */
export const createOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { items, shipping_address_id, payment_method, shipping_method_id, payment_proof_url } = req.body;

    // Validate items
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_ITEMS',
          message: 'El pedido debe tener al menos un producto',
        },
      });
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      let subtotal = 0;
      const orderItemsData = [];

      // Process items and check stock
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.product_id },
          include: { variants: true },
        });

        if (!product) {
          throw new Error(`Producto no encontrado: ${item.product_id}`);
        }

        let price = Number(product.price);
        let variant = null;

        if (item.variant_id) {
          variant = product.variants.find((v) => v.id === item.variant_id);
          if (!variant) {
            throw new Error(`Variante no encontrada: ${item.variant_id}`);
          }
          if (variant.stock < item.quantity) {
            throw new Error(`Stock insuficiente para ${product.name} (${variant.sku})`);
          }
          price = Number(variant.price); // Use variant price if available
          
          // Update variant stock
          await tx.productVariant.update({
            where: { id: variant.id },
            data: { stock: { decrement: item.quantity } },
          });
        } else {
          if (product.stock < item.quantity) {
            throw new Error(`Stock insuficiente para ${product.name}`);
          }
          
          // Update product stock
          await tx.product.update({
            where: { id: product.id },
            data: { stock: { decrement: item.quantity } },
          });
        }

        const itemSubtotal = price * item.quantity;
        subtotal += itemSubtotal;

        orderItemsData.push({
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity,
          price: price,
          subtotal: itemSubtotal,
        });
      }

      // Calculate shipping (hardcoded for now, can be dynamic)
      const shippingCost = 0;
      let total = subtotal + shippingCost;
      let discountAmount = 0;

      // Handle Points Redemption
      const { redeem_points } = req.body;
      if (redeem_points && redeem_points > 0) {
        const user = await tx.user.findUnique({ where: { id: userId } });
        
        if (user.loyalty_points < redeem_points) {
          throw new Error('Puntos de lealtad insuficientes');
        }

        // 100 points = $1 discount (Example ratio)
        discountAmount = redeem_points / 100;
        
        // Ensure discount doesn't exceed total
        if (discountAmount > total) {
          discountAmount = total;
          // Adjust points used if needed? For now, simple logic.
        }

        total -= discountAmount;

        // Deduct points
        await tx.user.update({
          where: { id: userId },
          data: { loyalty_points: { decrement: redeem_points } },
        });

        // Record transaction
        await tx.loyaltyTransaction.create({
          data: {
            user_id: userId,
            points: -redeem_points,
            type: 'REDEEMED',
            description: `Canje en pedido`,
          },
        });
      }

      // Generate order number (simple timestamp based)
      const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Create order
      const newOrder = await tx.order.create({
        data: {
          order_number: orderNumber,
          user_id: userId,
          shipping_address_id,
          shipping_method_id,
          payment_method,
          status: 'PENDING',
          payment_status: payment_method === 'CASH_ON_DELIVERY' ? 'PENDING' : 'PENDING',
          subtotal,
          shipping_cost: shippingCost,
          tax_amount: 0,
          total_amount: total,
          // payment_proof_url, // Uncomment if column exists
          items: {
            create: orderItemsData,
          },
          status_history: {
            create: {
              status: 'PENDING',
              notes: 'Pedido creado',
            },
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          user: true,
        },
      });

      // Link loyalty transaction if points redeemed
      if (redeem_points && redeem_points > 0) {
        await tx.loyaltyTransaction.updateMany({
          where: { 
            user_id: userId, 
            type: 'REDEEMED', 
            order_id: null,
            created_at: { gte: new Date(Date.now() - 10000) } // Safety check, recently created
          }, 
          data: { order_id: newOrder.id }
        });
      }

      return newOrder;
    });

    // Send confirmation email (async)
    const orderForEmail = {
      ...result,
      items: result.items.map(item => ({
        ...item,
        product_name: item.product.name,
      })),
    };
    sendOrderConfirmationEmail(orderForEmail).catch(err => console.error('Failed to send order email:', err));

    res.status(201).json({
      success: true,
      message: 'Pedido creado exitosamente',
      data: result,
    });
  } catch (error) {
    // Handle specific errors
    if (error.message.includes('Stock insuficiente') || error.message.includes('no encontrado')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ORDER',
          message: error.message,
        },
      });
    }
    next(error);
  }
};
