import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getPromotions = async (req, res) => {
  try {
    const promotions = await prisma.promotion.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            images: {
              where: { is_primary: true },
              take: 1,
              select: { url: true }
            }
          }
        }
      }
    });
    res.json(promotions);
  } catch (error) {
    console.error('Error getting promotions:', error);
    res.status(500).json({ message: 'Error al obtener las promociones' });
  }
};

export const getPromotion = async (req, res) => {
  try {
    const { id } = req.params;
    const promotion = await prisma.promotion.findUnique({
      where: { id: parseInt(id) },
      include: {
        product: true
      }
    });

    if (!promotion) {
      return res.status(404).json({ message: 'Promoción no encontrada' });
    }

    res.json(promotion);
  } catch (error) {
    console.error('Error getting promotion:', error);
    res.status(500).json({ message: 'Error al obtener la promoción' });
  }
};

export const createPromotion = async (req, res) => {
  try {
    const { title, description, discount_percent, start_date, end_date, is_active, image_url, product_id } = req.body;

    const promotion = await prisma.promotion.create({
      data: {
        title,
        description,
        discount_percent: discount_percent ? parseInt(discount_percent) : null,
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        is_active: is_active ?? true,
        image_url,
        product_id: product_id ? parseInt(product_id) : null
      }
    });

    res.status(201).json(promotion);
  } catch (error) {
    console.error('Error creating promotion:', error);
    res.status(500).json({ message: 'Error al crear la promoción' });
  }
};

export const updatePromotion = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, discount_percent, start_date, end_date, is_active, image_url, product_id } = req.body;

    const promotion = await prisma.promotion.update({
      where: { id: parseInt(id) },
      data: {
        title,
        description,
        discount_percent: discount_percent ? parseInt(discount_percent) : null,
        start_date: start_date ? new Date(start_date) : undefined,
        end_date: end_date ? new Date(end_date) : undefined,
        is_active,
        image_url,
        product_id: product_id ? parseInt(product_id) : null
      }
    });

    res.json(promotion);
  } catch (error) {
    console.error('Error updating promotion:', error);
    res.status(500).json({ message: 'Error al actualizar la promoción' });
  }
};

export const deletePromotion = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.promotion.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Promoción eliminada correctamente' });
  } catch (error) {
    console.error('Error deleting promotion:', error);
    res.status(500).json({ message: 'Error al eliminar la promoción' });
  }
};
