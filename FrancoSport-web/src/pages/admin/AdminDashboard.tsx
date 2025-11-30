/**
 * Admin Dashboard Page
 * Franco Sport E-Commerce
 * 
 * Panel principal con métricas y estadísticas
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import {
  TrendingUp,
  ShoppingCart,
  Users,
  Package,
  DollarSign,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
} from 'lucide-react';

interface DashboardStats {
  totalSales: number;
  salesGrowth: number;
  totalOrders: number;
  ordersGrowth: number;
  totalCustomers: number;
  customersGrowth: number;
  totalProducts: number;
  lowStockProducts: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 12450.50,
    salesGrowth: 12.5,
    totalOrders: 48,
    ordersGrowth: 8.3,
    totalCustomers: 156,
    customersGrowth: 15.2,
    totalProducts: 24,
    lowStockProducts: 3,
    pendingOrders: 5,
    processingOrders: 8,
    shippedOrders: 12,
    deliveredOrders: 23,
  });

  const [recentOrders, setRecentOrders] = useState([
    {
      id: 1,
      orderNumber: 'FS-2024-00001',
      customer: 'Juan Pérez',
      total: 285.00,
      status: 'PENDING',
      date: '2024-11-29',
    },
    {
      id: 2,
      orderNumber: 'FS-2024-00002',
      customer: 'María González',
      total: 450.00,
      status: 'PROCESSING',
      date: '2024-11-29',
    },
    {
      id: 3,
      orderNumber: 'FS-2024-00003',
      customer: 'Carlos Rodríguez',
      total: 180.00,
      status: 'SHIPPED',
      date: '2024-11-28',
    },
    {
      id: 4,
      orderNumber: 'FS-2024-00004',
      customer: 'Ana Martínez',
      total: 320.00,
      status: 'DELIVERED',
      date: '2024-11-28',
    },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'PROCESSING':
        return 'bg-blue-500/10 text-blue-500';
      case 'SHIPPED':
        return 'bg-purple-500/10 text-purple-500';
      case 'DELIVERED':
        return 'bg-green-500/10 text-green-500';
      case 'CANCELLED':
        return 'bg-red-500/10 text-red-500';
      default:
        return 'bg-neutral-500/10 text-neutral-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Pendiente';
      case 'PROCESSING':
        return 'Procesando';
      case 'SHIPPED':
        return 'Enviado';
      case 'DELIVERED':
        return 'Entregado';
      case 'CANCELLED':
        return 'Cancelado';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white mb-2">Dashboard</h1>
        <p className="text-neutral-400">
          Bienvenido de vuelta. Aquí está un resumen de tu tienda.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Sales */}
        <div className="bg-[#1A1A1A] border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-500" />
            </div>
            <div
              className={`flex items-center space-x-1 text-sm font-medium ${
                stats.salesGrowth >= 0 ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {stats.salesGrowth >= 0 ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : (
                <ArrowDownRight className="w-4 h-4" />
              )}
              <span>{Math.abs(stats.salesGrowth)}%</span>
            </div>
          </div>
          <h3 className="text-2xl font-black text-white mb-1">
            ${stats.totalSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-sm text-neutral-400">Ventas Totales</p>
        </div>

        {/* Total Orders */}
        <div className="bg-[#1A1A1A] border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-blue-500" />
            </div>
            <div
              className={`flex items-center space-x-1 text-sm font-medium ${
                stats.ordersGrowth >= 0 ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {stats.ordersGrowth >= 0 ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : (
                <ArrowDownRight className="w-4 h-4" />
              )}
              <span>{Math.abs(stats.ordersGrowth)}%</span>
            </div>
          </div>
          <h3 className="text-2xl font-black text-white mb-1">{stats.totalOrders}</h3>
          <p className="text-sm text-neutral-400">Pedidos Totales</p>
        </div>

        {/* Total Customers */}
        <div className="bg-[#1A1A1A] border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-500" />
            </div>
            <div
              className={`flex items-center space-x-1 text-sm font-medium ${
                stats.customersGrowth >= 0 ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {stats.customersGrowth >= 0 ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : (
                <ArrowDownRight className="w-4 h-4" />
              )}
              <span>{Math.abs(stats.customersGrowth)}%</span>
            </div>
          </div>
          <h3 className="text-2xl font-black text-white mb-1">{stats.totalCustomers}</h3>
          <p className="text-sm text-neutral-400">Clientes Totales</p>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-[#1A1A1A] border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <Link
              to={ROUTES.ADMIN_PRODUCTS}
              className="text-sm text-primary hover:underline"
            >
              Ver todos →
            </Link>
          </div>
          <h3 className="text-2xl font-black text-white mb-1">
            {stats.lowStockProducts}
          </h3>
          <p className="text-sm text-neutral-400">Productos con Stock Bajo</p>
        </div>
      </div>

      {/* Order Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#1A1A1A] border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-3">
            <Clock className="w-5 h-5 text-yellow-500" />
            <h4 className="text-sm font-medium text-neutral-400">Pendientes</h4>
          </div>
          <p className="text-2xl font-black text-white">{stats.pendingOrders}</p>
        </div>

        <div className="bg-[#1A1A1A] border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-3">
            <Package className="w-5 h-5 text-blue-500" />
            <h4 className="text-sm font-medium text-neutral-400">Procesando</h4>
          </div>
          <p className="text-2xl font-black text-white">{stats.processingOrders}</p>
        </div>

        <div className="bg-[#1A1A1A] border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-3">
            <Truck className="w-5 h-5 text-purple-500" />
            <h4 className="text-sm font-medium text-neutral-400">Enviados</h4>
          </div>
          <p className="text-2xl font-black text-white">{stats.shippedOrders}</p>
        </div>

        <div className="bg-[#1A1A1A] border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <h4 className="text-sm font-medium text-neutral-400">Entregados</h4>
          </div>
          <p className="text-2xl font-black text-white">{stats.deliveredOrders}</p>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-[#1A1A1A] border border-neutral-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-white">Pedidos Recientes</h2>
          <Link
            to={ROUTES.ADMIN_ORDERS}
            className="text-sm text-primary hover:underline font-medium"
          >
            Ver todos →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="text-left text-sm font-medium text-neutral-400 pb-3">
                  N° Pedido
                </th>
                <th className="text-left text-sm font-medium text-neutral-400 pb-3">
                  Cliente
                </th>
                <th className="text-left text-sm font-medium text-neutral-400 pb-3">
                  Total
                </th>
                <th className="text-left text-sm font-medium text-neutral-400 pb-3">
                  Estado
                </th>
                <th className="text-left text-sm font-medium text-neutral-400 pb-3">
                  Fecha
                </th>
                <th className="text-right text-sm font-medium text-neutral-400 pb-3">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-neutral-800/50">
                  <td className="py-4">
                    <span className="text-sm font-medium text-white">
                      {order.orderNumber}
                    </span>
                  </td>
                  <td className="py-4">
                    <span className="text-sm text-neutral-300">{order.customer}</span>
                  </td>
                  <td className="py-4">
                    <span className="text-sm font-medium text-white">
                      ${order.total.toFixed(2)}
                    </span>
                  </td>
                  <td className="py-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td className="py-4">
                    <span className="text-sm text-neutral-400">{order.date}</span>
                  </td>
                  <td className="py-4 text-right">
                    <Link
                      to={`${ROUTES.ADMIN_ORDERS}/${order.orderNumber}`}
                      className="text-sm text-primary hover:underline"
                    >
                      Ver detalle →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to={ROUTES.ADMIN_PRODUCT_CREATE}
          className="bg-[#1A1A1A] border border-neutral-800 rounded-xl p-6 hover:border-primary transition-colors group"
        >
          <Package className="w-8 h-8 text-primary mb-4" />
          <h3 className="text-lg font-bold text-white mb-2 group-hover:text-primary transition-colors">
            Crear Producto
          </h3>
          <p className="text-sm text-neutral-400">
            Agrega un nuevo producto al catálogo
          </p>
        </Link>

        <Link
          to={ROUTES.ADMIN_ORDERS}
          className="bg-[#1A1A1A] border border-neutral-800 rounded-xl p-6 hover:border-primary transition-colors group"
        >
          <ShoppingCart className="w-8 h-8 text-primary mb-4" />
          <h3 className="text-lg font-bold text-white mb-2 group-hover:text-primary transition-colors">
            Gestionar Pedidos
          </h3>
          <p className="text-sm text-neutral-400">
            Administra y actualiza el estado de los pedidos
          </p>
        </Link>

        <Link
          to={ROUTES.ADMIN_USERS}
          className="bg-[#1A1A1A] border border-neutral-800 rounded-xl p-6 hover:border-primary transition-colors group"
        >
          <Users className="w-8 h-8 text-primary mb-4" />
          <h3 className="text-lg font-bold text-white mb-2 group-hover:text-primary transition-colors">
            Ver Clientes
          </h3>
          <p className="text-sm text-neutral-400">
            Administra los usuarios registrados
          </p>
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;
