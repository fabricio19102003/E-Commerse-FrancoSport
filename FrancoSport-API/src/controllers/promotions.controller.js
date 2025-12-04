import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getActivePromotions = async (req, res) => {
  try {
    const now = new Date();
    const promotions = await prisma.promotion.findMany({
      where: {
        is_active: true,
        start_date: { lte: now },
        end_date: { gte: now }
      },
      orderBy: {
        end_date: 'asc'
      },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            compare_at_price: true,
            images: {
              where: { is_primary: true },
              take: 1
            }
          }
        },
        categories: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    res.json(promotions);
  } catch (error) {
    console.error('Error getting active promotions:', error);
    res.status(500).json({ message: 'Error al obtener las promociones activas' });
  }
};

export const getPromotionById = async (req, res) => {
  try {
    const { id } = req.params;
    const promotion = await prisma.promotion.findUnique({
      where: { id: parseInt(id) },
      include: {
        products: {
          where: { is_active: true },
          include: {
            images: { where: { is_primary: true }, take: 1 }
          }
        },
        categories: {
          include: {
            products: {
              where: { is_active: true },
              include: {
                images: { where: { is_primary: true }, take: 1 }
              }
            }
          }
        }
      }
    });

    if (!promotion) {
      return res.status(404).json({ message: 'Promoción no encontrada' });
    }

    // Combine products from direct relation and categories
    let allProducts = [...promotion.products];
    promotion.categories.forEach(cat => {
      allProducts = [...allProducts, ...cat.products];
    });

    // Remove duplicates
    const uniqueProducts = Array.from(new Map(allProducts.map(item => [item.id, item])).values());

    // Apply discount to products for display
    const productsWithDiscount = uniqueProducts.map(p => {
      const originalPrice = parseFloat(p.price);
      const discountAmount = (originalPrice * promotion.discount_percent) / 100;
      return {
        ...p,
        price: originalPrice - discountAmount,
        compare_at_price: originalPrice,
        discount_percent: promotion.discount_percent
      };
    });

    res.json({
      ...promotion,
      products: productsWithDiscount
    });
  } catch (error) {
    console.error('Error getting promotion details:', error);
    res.status(500).json({ message: 'Error al obtener los detalles de la promoción' });
  }
};
