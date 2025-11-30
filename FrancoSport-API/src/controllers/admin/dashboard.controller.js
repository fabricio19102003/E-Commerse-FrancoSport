/**
 * Admin Dashboard Controller
 * Franco Sport API
 * 
 * Controlador para métricas y estadísticas del dashboard
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get dashboard statistics
 * GET /api/admin/dashboard/stats
 */
export const getDashboardStats = async (req, res, next) => {
  try {
    // 1. Calculate date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // 2. Run parallel queries for basic counts
    const [
      totalOrders,
      totalCustomers,
      totalProducts,
      lowStockProducts,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders
    ] = await Promise.all([
      prisma.order.count(),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.product.count(),
      prisma.product.count({ where: { stock: { lte: 5 } } }),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.order.count({ where: { status: 'PROCESSING' } }),
      prisma.order.count({ where: { status: 'SHIPPED' } }),
      prisma.order.count({ where: { status: 'DELIVERED' } }),
      prisma.order.count({ where: { status: 'CANCELLED' } })
    ]);

    // 3. Calculate Revenue
    const paidOrders = await prisma.order.findMany({
      where: { 
        payment_status: 'PAID',
        status: { not: 'CANCELLED' }
      },
      select: { total_amount: true, created_at: true }
    });

    const totalRevenue = paidOrders.reduce((sum, order) => sum + parseFloat(order.total_amount.toString()), 0);

    // 4. Calculate Growth (Month over Month)
    
    // Current Month Revenue
    const currentMonthRevenue = paidOrders
      .filter(o => o.created_at >= startOfMonth)
      .reduce((sum, o) => sum + parseFloat(o.total_amount.toString()), 0);
      
    // Last Month Revenue
    const lastMonthRevenue = paidOrders
      .filter(o => o.created_at >= startOfLastMonth && o.created_at <= endOfLastMonth)
      .reduce((sum, o) => sum + parseFloat(o.total_amount.toString()), 0);

    const revenueGrowth = lastMonthRevenue === 0 
      ? 100 
      : ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;

    // Sales Growth (Count)
    const currentMonthOrders = await prisma.order.count({
      where: { created_at: { gte: startOfMonth } }
    });

    const lastMonthOrders = await prisma.order.count({
      where: { 
        created_at: { 
          gte: startOfLastMonth,
          lte: endOfLastMonth
        } 
      }
    });

    const ordersGrowth = lastMonthOrders === 0
      ? 100
      : ((currentMonthOrders - lastMonthOrders) / lastMonthOrders) * 100;

    // Customers Growth
    const currentMonthCustomers = await prisma.user.count({
      where: { 
        role: 'CUSTOMER',
        created_at: { gte: startOfMonth } 
      }
    });

    const lastMonthCustomers = await prisma.user.count({
      where: { 
        role: 'CUSTOMER',
        created_at: { 
          gte: startOfLastMonth,
          lte: endOfLastMonth
        } 
      }
    });

    const customersGrowth = lastMonthCustomers === 0
      ? 100
      : ((currentMonthCustomers - lastMonthCustomers) / lastMonthCustomers) * 100;

    // 5. Sales by Day (Last 7 days)
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 6);
    last7Days.setHours(0, 0, 0, 0);

    const recentSales = await prisma.order.findMany({
      where: {
        created_at: { gte: last7Days },
        payment_status: 'PAID'
      },
      select: {
        created_at: true,
        total_amount: true
      }
    });

    const salesByDay = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(last7Days);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      const daySales = recentSales
        .filter(s => s.created_at.toISOString().split('T')[0] === dateStr)
        .reduce((sum, s) => sum + parseFloat(s.total_amount.toString()), 0);
        
      salesByDay.push({
        date: dateStr,
        amount: daySales
      });
    }

    res.json({
      success: true,
      data: {
        // Sales
        totalSales: totalRevenue,
        salesGrowth: revenueGrowth, // Using revenue growth for sales growth display
        salesByDay,
        
        // Orders
        totalOrders,
        ordersGrowth,
        pendingOrders,
        processingOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,
        
        // Customers
        totalCustomers,
        customersGrowth,
        newCustomersThisMonth: currentMonthCustomers,
        
        // Products
        totalProducts,
        lowStockProducts,
        outOfStockProducts: 0, // TODO: Add if needed
        featuredProducts: 0, // TODO: Add if needed
        
        // Revenue
        totalRevenue,
        revenueGrowth,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get recent orders
 * GET /api/admin/dashboard/recent-orders
 */
export const getRecentOrders = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const orders = await prisma.order.findMany({
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        user: {
          select: {
            first_name: true,
            last_name: true,
            email: true
          }
        }
      }
    });

    const formattedOrders = orders.map(order => ({
      id: order.id,
      orderNumber: order.order_number,
      customer: {
        name: `${order.user.first_name} ${order.user.last_name}`,
        email: order.user.email
      },
      total: parseFloat(order.total_amount),
      status: order.status,
      createdAt: order.created_at
    }));

    res.json({
      success: true,
      data: formattedOrders
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get top selling products
 * GET /api/admin/dashboard/top-products
 */
export const getTopProducts = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    // Group by product_id on order items
    const topSelling = await prisma.orderItem.groupBy({
      by: ['product_id'],
      _sum: {
        quantity: true,
        subtotal: true
      },
      orderBy: {
        _sum: {
          quantity: 'desc'
        }
      },
      take: limit
    });

    // Now fetch product details
    const productIds = topSelling.map(item => item.product_id);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        images: {
          where: { is_primary: true },
          take: 1
        }
      }
    });

    // Merge data
    const formattedProducts = topSelling.map(item => {
      const product = products.find(p => p.id === item.product_id);
      if (!product) return null;

      return {
        id: product.id,
        name: product.name,
        image: product.images[0]?.url || 'https://via.placeholder.com/150',
        soldCount: item._sum.quantity,
        revenue: parseFloat(item._sum.subtotal || 0)
      };
    }).filter(Boolean);

    res.json({
      success: true,
      data: formattedProducts
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get sales by period
 * GET /api/admin/dashboard/sales
 */
export const getSalesByPeriod = async (req, res, next) => {
  try {
    // Basic implementation for now
    res.json({
      success: true,
      data: []
    });
  } catch (error) {
    next(error);
  }
};
