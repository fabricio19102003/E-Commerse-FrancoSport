import { PrismaClient } from '@prisma/client';
import { broadcastPromotion } from '../../services/email.service.js';

const prisma = new PrismaClient();

export const getPromotions = async (req, res) => {
  try {
    const promotions = await prisma.promotion.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        products: {
          select: {
            id: true,
            name: true,
          }
        },
        categories: {
          select: {
            id: true,
            name: true
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
        products: {
          select: { id: true, name: true }
        },
        categories: {
          select: { id: true, name: true }
        }
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
    const { 
      title, 
      description, 
      discount_percent, 
      start_date, 
      end_date, 
      is_active, 
      image_url, 
      product_ids, 
      category_ids,
      notify_users 
    } = req.body;

    const promotion = await prisma.promotion.create({
      data: {
        title,
        description,
        discount_percent: discount_percent ? parseInt(discount_percent) : null,
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        is_active: is_active ?? true,
        image_url,
        products: product_ids?.length > 0 ? {
          connect: product_ids.map(id => ({ id: parseInt(id) }))
        } : undefined,
        categories: category_ids?.length > 0 ? {
          connect: category_ids.map(id => ({ id: parseInt(id) }))
        } : undefined
      },
      include: {
        products: { select: { id: true, name: true } },
        categories: { select: { id: true, name: true } }
      }
    });

    // Handle automatic notification
    if (notify_users) {
      broadcastPromotion(promotion).catch(err => console.error('Broadcast failed:', err));
    }

    res.status(201).json(promotion);
  } catch (error) {
    console.error('Error creating promotion:', error);
    res.status(500).json({ message: 'Error al crear la promoción' });
  }
};

export const updatePromotion = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      description, 
      discount_percent, 
      start_date, 
      end_date, 
      is_active, 
      image_url, 
      product_ids, 
      category_ids 
    } = req.body;

    // First disconnect existing relations if new ones are provided
    if (product_ids || category_ids) {
      await prisma.promotion.update({
        where: { id: parseInt(id) },
        data: {
          products: product_ids ? { set: [] } : undefined,
          categories: category_ids ? { set: [] } : undefined
        }
      });
    }

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
        products: product_ids?.length > 0 ? {
          connect: product_ids.map(id => ({ id: parseInt(id) }))
        } : undefined,
        categories: category_ids?.length > 0 ? {
          connect: category_ids.map(id => ({ id: parseInt(id) }))
        } : undefined
      },
      include: {
        products: { select: { id: true, name: true } },
        categories: { select: { id: true, name: true } }
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
    res.status(500).json({ message: 'Error al eliminar la promoción' });
  }
};

export const notifyUsers = async (req, res) => {
  try {
    const { id } = req.params;
    
    const promotion = await prisma.promotion.findUnique({
      where: { id: parseInt(id) }
    });

    if (!promotion) {
      return res.status(404).json({ message: 'Promoción no encontrada' });
    }

    // Run in background to avoid timeout
    broadcastPromotion(promotion).catch(err => console.error('Broadcast failed:', err));

    res.json({ 
      message: 'El proceso de envío de correos ha comenzado. Esto puede tomar unos minutos.' 
    });
  } catch (error) {
    console.error('Error initiating broadcast:', error);
    res.status(500).json({ message: 'Error al iniciar el envío de correos' });
  }
};
