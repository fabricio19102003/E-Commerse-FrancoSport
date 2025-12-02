/**
 * Admin Orders Page
 * Franco Sport E-Commerce
 * 
 * Gestión de pedidos y actualización de estados - CONECTADO CON API
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { adminOrdersService } from '@/api/admin';
import {
  Search,
  Eye,
  Clock,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  DollarSign,
  Download,
  Loader2,
} from 'lucide-react';
import type { Order } from '@/types';

const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pending: 0,
    processing: 0,
    shipped: 0,
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Fetch orders from API
  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const filters: any = {};
      if (searchTerm) filters.search = searchTerm;
      if (statusFilter) filters.status = statusFilter;
      if (paymentFilter) filters.payment_status = paymentFilter;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;

      const response = await adminOrdersService.getOrders(filters);
      setOrders(response.data);

      if (startDate || endDate) {
        setStats(prev => ({
          ...prev,
          totalRevenue: response.totalRevenue || 0
        }));
      } else {
        fetchStats();
      }
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err.response?.data?.error?.message || 'Error al cargar pedidos');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const statsData = await adminOrdersService.getOrderStats();
      setStats({
        totalRevenue: statsData.totalRevenue,
        pending: statsData.pending,
        processing: statsData.processing,
        shipped: statsData.shipped,
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  useEffect(() => {
    fetchOrders();
    // fetchStats is now called inside fetchOrders if needed
  }, [searchTerm, statusFilter, paymentFilter, startDate, endDate]);

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string; icon: React.FC<any> }> = {
      PENDING: {
        label: 'Pendiente',
        color: 'yellow',
        icon: Clock,
      },
      PROCESSING: {
        label: 'Procesando',
        color: 'blue',
        icon: Package,
      },
      PAID: {
        label: 'Pagado',
        color: 'green',
        icon: CheckCircle,
      },
      SHIPPED: {
        label: 'Enviado',
        color: 'purple',
        icon: Truck,
      },
      DELIVERED: {
        label: 'Entregado',
        color: 'green',
        icon: CheckCircle,
      },
      CANCELLED: {
        label: 'Cancelado',
        color: 'red',
        icon: XCircle,
      },
    };
    return configs[status] || configs.PENDING;
  };

  const getPaymentStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string }> = {
      PAID: { label: 'Pagado', color: 'green' },
      PENDING: { label: 'Pendiente', color: 'yellow' },
      FAILED: { label: 'Fallido', color: 'red' },
      REFUNDED: { label: 'Reembolsado', color: 'blue' },
    };
    return configs[status] || configs.PENDING;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white mb-2">Pedidos</h1>
          <p className="text-neutral-400">
            Gestiona y actualiza el estado de los pedidos
          </p>
        </div>
        <button className="inline-flex items-center space-x-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold rounded-lg transition-colors">
          <Download className="w-5 h-5" />
          <span>Exportar a CSV</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#1A1A1A] border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-3">
            <DollarSign className="w-5 h-5 text-green-500" />
            <h4 className="text-sm font-medium text-neutral-400">
              {startDate || endDate ? 'Ingresos (Filtrado)' : 'Ingresos Totales'}
            </h4>
          </div>
          <p className="text-2xl font-black text-white">${stats.totalRevenue.toFixed(2)}</p>
        </div>

        <div className="bg-[#1A1A1A] border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-3">
            <Clock className="w-5 h-5 text-yellow-500" />
            <h4 className="text-sm font-medium text-neutral-400">Pendientes</h4>
          </div>
          <p className="text-2xl font-black text-white">{stats.pending}</p>
        </div>

        <div className="bg-[#1A1A1A] border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-3">
            <Package className="w-5 h-5 text-blue-500" />
            <h4 className="text-sm font-medium text-neutral-400">Procesando</h4>
          </div>
          <p className="text-2xl font-black text-white">{stats.processing}</p>
        </div>

        <div className="bg-[#1A1A1A] border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-3">
            <Truck className="w-5 h-5 text-purple-500" />
            <h4 className="text-sm font-medium text-neutral-400">Enviados</h4>
          </div>
          <p className="text-2xl font-black text-white">{stats.shipped}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#1A1A1A] border border-neutral-800 rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
            <input
              type="text"
              placeholder="Buscar por número o cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-black border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-primary"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-black border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-primary"
          >
            <option value="">Todos los estados</option>
            <option value="PENDING">Pendiente</option>
            <option value="PROCESSING">Procesando</option>
            <option value="PAID">Pagado</option>
            <option value="SHIPPED">Enviado</option>
            <option value="DELIVERED">Entregado</option>
            <option value="CANCELLED">Cancelado</option>
          </select>

          {/* Payment Filter */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-4 py-2 bg-black border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-primary"
          >
            <option value="">Estado de pago</option>
            <option value="PAID">Pagado</option>
            <option value="PENDING">Pendiente</option>
            <option value="FAILED">Fallido</option>
            <option value="REFUNDED">Reembolsado</option>
          </select>

          {/* Date Filters */}
          <div className="flex gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-4 py-2 bg-black border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-primary w-full"
              placeholder="Fecha inicio"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-4 py-2 bg-black border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-primary w-full"
              placeholder="Fecha fin"
            />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500 rounded-xl p-4">
          <p className="text-red-500 font-medium">{error}</p>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-[#1A1A1A] border border-neutral-800 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 text-primary mx-auto mb-4 animate-spin" />
            <p className="text-neutral-400">Cargando pedidos...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-16 h-16 text-neutral-700 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No hay pedidos</h3>
            <p className="text-neutral-400">
              {searchTerm || statusFilter || paymentFilter
                ? 'No se encontraron pedidos con los filtros seleccionados'
                : 'Aún no se han realizado pedidos'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black">
                <tr>
                  <th className="text-left text-sm font-medium text-neutral-400 px-6 py-4">
                    Pedido
                  </th>
                  <th className="text-left text-sm font-medium text-neutral-400 px-6 py-4">
                    Cliente
                  </th>
                  <th className="text-left text-sm font-medium text-neutral-400 px-6 py-4">
                    Total
                  </th>
                  <th className="text-left text-sm font-medium text-neutral-400 px-6 py-4">
                    Estado
                  </th>
                  <th className="text-left text-sm font-medium text-neutral-400 px-6 py-4">
                    Pago
                  </th>
                  <th className="text-left text-sm font-medium text-neutral-400 px-6 py-4">
                    Fecha
                  </th>
                  <th className="text-right text-sm font-medium text-neutral-400 px-6 py-4">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const statusConfig = getStatusConfig(order.status);
                  const paymentConfig = getPaymentStatusConfig(order.payment_status);
                  const StatusIcon = statusConfig.icon;

                  return (
                    <tr key={order.id} className="border-t border-neutral-800 hover:bg-neutral-900/50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-white font-mono">{order.order_number}</p>
                          <p className="text-sm text-neutral-400">{order.itemsCount || order.items?.length || 0} items</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-white">{order.customer?.name || 'N/A'}</p>
                          <p className="text-sm text-neutral-400">{order.customer?.email || 'N/A'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-white">${parseFloat(order.total_amount?.toString() || '0').toFixed(2)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-${statusConfig.color}-500/10 text-${statusConfig.color}-500`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          <span>{statusConfig.label}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${paymentConfig.color}-500/10 text-${paymentConfig.color}-500`}
                        >
                          {paymentConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-neutral-300">{formatDate(order.created_at)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end">
                          <Link
                            to={`${ROUTES.ADMIN_ORDERS}/${order.order_number}`}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors text-sm font-medium"
                          >
                            <Eye className="w-4 h-4" />
                            <span>Ver detalle</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrders;
