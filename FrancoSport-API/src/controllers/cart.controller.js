/**
 * Cart Controller
 * Franco Sport E-Commerce
 */

import prisma from '../utils/prisma.js';

/**
 * Get user's cart
 * GET /api/cart
 */
export const getCart = async (req, res, next) => {
  try {
    const userId = req.user.id;

    let cart = await prisma.cart.findFirst({
      where: { user_id: userId },
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
      },
    });

    // Create cart if doesn't exist
    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          user_id: userId,
        },
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
        },
      });
    }

    // Calculate totals
    const subtotal = cart.items.reduce((sum, item) => {
      return sum + Number(item.price_at_add) * item.quantity;
    }, 0);

    const itemsCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    res.json({
      success: true,
      data: {
        ...cart,
        subtotal,
        items_count: itemsCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add item to cart
 * POST /api/cart/items
 */
export const addToCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { product_id, variant_id, quantity = 1 } = req.body;

    // Verify product exists and has stock
    const product = await prisma.product.findUnique({
      where: { id: product_id },
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

    // Check stock
    let availableStock = product.stock;
    let price = product.price;

    if (variant_id) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: variant_id },
      });

      if (!variant || !variant.is_active) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'VARIANT_NOT_FOUND',
            message: 'Variante no encontrada',
          },
        });
      }

      availableStock = variant.stock;
      price = variant.price || product.price;
    }

    if (availableStock < quantity) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_STOCK',
          message: 'Stock insuficiente',
        },
      });
    }

    // Get or create cart
    let cart = await prisma.cart.findFirst({
      where: { user_id: userId },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { user_id: userId },
      });
    }

    // Check if item already exists
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cart_id: cart.id,
        product_id,
        variant_id,
      },
    });

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity;

      if (availableStock < newQuantity) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_STOCK',
            message: 'Stock insuficiente',
          },
        });
      }

      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      // Create new item
      await prisma.cartItem.create({
        data: {
          cart_id: cart.id,
          product_id,
          variant_id,
          quantity,
          price_at_add: price,
        },
      });
    }

    // Return updated cart
    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
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
      },
    });

    const subtotal = updatedCart.items.reduce((sum, item) => {
      return sum + Number(item.price_at_add) * item.quantity;
    }, 0);

    res.json({
      success: true,
      message: 'Producto agregado al carrito',
      data: {
        ...updatedCart,
        subtotal,
        items_count: updatedCart.items.reduce((sum, item) => sum + item.quantity, 0),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update cart item quantity
 * PUT /api/cart/items/:itemId
 */
export const updateCartItem = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;
    const { quantity } = req.body;

    // Find cart item
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: parseInt(itemId) },
      include: {
        cart: true,
        product: true,
        variant: true,
      },
    });

    if (!cartItem || cartItem.cart.user_id !== userId) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CART_ITEM_NOT_FOUND',
          message: 'Item no encontrado en el carrito',
        },
      });
    }

    // Check stock
    const availableStock = cartItem.variant
      ? cartItem.variant.stock
      : cartItem.product.stock;

    if (quantity > availableStock) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_STOCK',
          message: `Solo hay ${availableStock} unidades disponibles`,
        },
      });
    }

    // Update quantity
    await prisma.cartItem.update({
      where: { id: parseInt(itemId) },
      data: { quantity },
    });

    // Return updated cart
    const updatedCart = await prisma.cart.findUnique({
      where: { id: cartItem.cart_id },
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
      },
    });

    const subtotal = updatedCart.items.reduce((sum, item) => {
      return sum + Number(item.price_at_add) * item.quantity;
    }, 0);

    res.json({
      success: true,
      message: 'Carrito actualizado',
      data: {
        ...updatedCart,
        subtotal,
        items_count: updatedCart.items.reduce((sum, item) => sum + item.quantity, 0),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove item from cart
 * DELETE /api/cart/items/:itemId
 */
export const removeFromCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;

    // Find cart item
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: parseInt(itemId) },
      include: {
        cart: true,
      },
    });

    if (!cartItem || cartItem.cart.user_id !== userId) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CART_ITEM_NOT_FOUND',
          message: 'Item no encontrado en el carrito',
        },
      });
    }

    // Delete item
    await prisma.cartItem.delete({
      where: { id: parseInt(itemId) },
    });

    // Return updated cart
    const updatedCart = await prisma.cart.findUnique({
      where: { id: cartItem.cart_id },
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
      },
    });

    const subtotal = updatedCart.items.reduce((sum, item) => {
      return sum + Number(item.price_at_add) * item.quantity;
    }, 0);

    res.json({
      success: true,
      message: 'Item eliminado del carrito',
      data: {
        ...updatedCart,
        subtotal,
        items_count: updatedCart.items.reduce((sum, item) => sum + item.quantity, 0),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Clear cart
 * DELETE /api/cart
 */
export const clearCart = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const cart = await prisma.cart.findFirst({
      where: { user_id: userId },
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CART_NOT_FOUND',
          message: 'Carrito no encontrado',
        },
      });
    }

    // Delete all items
    await prisma.cartItem.deleteMany({
      where: { cart_id: cart.id },
    });

    res.json({
      success: true,
      message: 'Carrito vaciado',
    });
  } catch (error) {
    next(error);
  }
};
