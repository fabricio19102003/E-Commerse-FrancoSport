/**
 * Loyalty Controller
 * Franco Sport API
 */

import prisma from '../utils/prisma.js';

/**
 * Get loyalty points history for current user
 * GET /api/loyalty/history
 */
export const getPointsHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const history = await prisma.loyaltyTransaction.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      include: {
        order: {
          select: {
            order_number: true,
            total: true,
          },
        },
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { loyalty_points: true },
    });

    res.json({
      success: true,
      data: {
        current_points: user.loyalty_points,
        history,
      },
    });
  } catch (error) {
    next(error);
  }
};
