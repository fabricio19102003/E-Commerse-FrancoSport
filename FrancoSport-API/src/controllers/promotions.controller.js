import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getActivePromotion = async (req, res) => {
  try {
    const now = new Date();
    const promotion = await prisma.promotion.findFirst({
      where: {
        is_active: true,
        start_date: { lte: now },
        end_date: { gte: now }
      },
      orderBy: {
        end_date: 'asc'
      },
      include: {
        product: {
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
        }
      }
    });

    res.json(promotion);
  } catch (error) {
    console.error('Error getting active promotion:', error);
    res.status(500).json({ message: 'Error al obtener la promoción activa' });
  }
};
