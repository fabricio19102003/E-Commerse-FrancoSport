import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const addToWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) }
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if already in wishlist
    const existingItem = await prisma.wishlistItem.findUnique({
      where: {
        user_id_product_id: {
          user_id: userId,
          product_id: parseInt(productId)
        }
      }
    });

    if (existingItem) {
      return res.status(400).json({ message: 'Product already in wishlist' });
    }

    const wishlistItem = await prisma.wishlistItem.create({
      data: {
        user_id: userId,
        product_id: parseInt(productId)
      }
    });

    res.status(201).json(wishlistItem);
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    res.status(500).json({ message: 'Error adding to wishlist' });
  }
};

export const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    await prisma.wishlistItem.deleteMany({
      where: {
        user_id: userId,
        product_id: parseInt(productId)
      }
    });

    res.json({ message: 'Product removed from wishlist' });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({ message: 'Error removing from wishlist' });
  }
};

export const getWishlist = async (req, res) => {
  try {
    const userId = req.user.id;

    const wishlistItems = await prisma.wishlistItem.findMany({
      where: { user_id: userId },
      include: {
        product: {
          include: {
            images: {
              where: { is_primary: true },
              take: 1
            },
            variants: true
          }
        }
      }
    });

    // Transform to return just the products with an added 'added_at' field if needed
    const products = wishlistItems.map(item => ({
      ...item.product,
      added_to_wishlist_at: item.created_at
    }));

    res.json(products);
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({ message: 'Error fetching wishlist' });
  }
};
