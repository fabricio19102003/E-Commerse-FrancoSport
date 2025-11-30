/**
 * Admin Order Detail Page
 * Franco Sport E-Commerce
 * 
 * Detalle completo de pedido y actualización de estado
 */

import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import {
  ArrowLeft,
  Package,
  User,
  MapPin,
  CreditCard,
  Truck,
  Calendar,
  DollarSign,
  Edit,
  Save,
  X,
  CheckCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react';

const AdminOrderDetail: React.FC = () => {
  const navigate = useNavigate();
  const { orderNumber } = useParams<{ orderNumber: string }>();

  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [notes, setNotes] = useState('');

  // Mock data - reemplazar con llamada a API
  const order = {
    id: 1,
    orderNumber: 'FS-2024-00001',
    status: 'PROCESSING',
    paymentStatus: 'PAID',
    paymentMethod: 'Tarjeta de Crédito',
    paymentId: 'pi_1234567890',
    customer: {
      name: 'Juan Pérez',
      email: 'juan@example.com',
      phone: '+591 12345678',
    },
    shippingAddress: {
      fullName: 'Juan Pérez',
      streetAddress: 'Av. Principal #123',
      city: 'Cobija',
      state: 'Pando',
      postalCode: '00000',
      country: 'Bolivia',
      phone: '+591 12345678',
    },
    shippingMethod: {
      name: 'Envío Estándar',
      cost: 20.00,
      estimatedDays: '3-5 días',
    },
    items: [
      {
        id: 1,
        productName: 'Edición Limitada Carbono',
        variantName: 'Talla: M',
        quantity: 1,
        priceAtPurchase: 180.00,
        image: 'https://images.unsplash.com/photo-1577212017184-80cc3c0bcb85?auto=format&fit=crop&q=80&w=400',
      },
      {
        id: 2,
        productName: 'Red Racing Beast',
        variantName: 'Talla: L',
        quantity: 1,
        priceAtPurchase: 165.00,
        image: 'https://images.unsplash.com/photo-1620799140408-ed5341cd2431?auto=format&fit=crop&q=80&w=400',
      },
    ],
    subtotal: 345.00,
    shippingCost: 20.00,
    taxAmount: 47.45,
    discountAmount: 0,
    totalAmount: 412.45,
    createdAt: '2024-11-29T10:30:00',
    paidAt: '2024-11-29T10:31:00',
    trackingNumber: null,
    adminNotes: '',
    statusHistory: [
      {
        id: 1,
        status: 'PENDING',
        notes: 'Pedido creado',
        createdAt: '2024-11-29T10:30:00',
        createdBy: 'Sistema',
      },
      {
        id: 2,
        status: 'PAID',
        notes: 'Pago confirmado',
        createdAt: '2024-11-29T10:31:00',
        createdBy: 'Sistema',
      },
      {
        id: 3,
        status: 'PROCESSING',
        notes: 'Pedido en preparación',
        createdAt: '2024-11-29T11:00:00',
        createdBy: 'Admin',
      },
    ],
  };

  const handleStatusUpdate = () => {
    // TODO: Implementar actualización de estado
    console.log('Update status to:', newStatus);
    console.log('Tracking number:', trackingNumber);
    console.log('Notes:', notes);

    alert('Estado actualizado exitosamente');
    setIsEditingStatus(false);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { label: 'Pendiente', color: 'bg-yellow-500/10 text-yellow-500', icon: Clock };
      case 'PROCESSING':
        return { label: 'Procesando', color: 'bg-blue-500/10 text-blue-500', icon: Package };
      case 'PAID':
        return { label: 'Pagado', color: 'bg-green-500/10 text-green-500', icon: CheckCircle };
      case 'SHIPPED':
        return { label: 'Enviado', color: 'bg-purple-500/10 text-purple-500', icon: Truck };
      case 'DELIVERED':
        return { label: 'Entregado', color: 'bg-green-500/10 text-green-500', icon: CheckCircle };
      case 'CANCELLED':
        return { label: 'Cancelado', color: 'bg-red-500/10 text-red-500', icon: X };
      default:
        return { label: status, color: 'bg-neutral-500/10 text-neutral-500', icon: AlertTriangle };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const statusConfig = getStatusConfig(order.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(ROUTES.ADMIN_ORDERS)}
            className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-400" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-white mb-2">
              Pedido {order.orderNumber}
            </h1>
            <p className="text-neutral-400">
              Creado el {formatDate(order.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium ${statusConfig.color}`}>
            <StatusIcon className="w-4 h-4" />
            <span>{statusConfig.label}</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-[#1A1A1A] border border-neutral-800 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Productos</h2>
            
            <div className="space-y-4">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center space-x-4 p-4 bg-black/50 rounded-lg"
                >
                  <img
                    src={item.image}
                    alt={item.productName}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-white">{item.productName}</h3>
                    <p className="text-sm text-neutral-400">{item.variantName}</p>
                    <p className="text-sm text-neutral-400 mt-1">
                      Cantidad: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-white">
                      ${item.priceAtPurchase.toFixed(2)}
                    </p>
                    <p className="text-sm text-neutral-500">
                      ${(item.priceAtPurchase * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="mt-6 pt-6 border-t border-neutral-800 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-400">Subtotal</span>
                <span className="text-white">${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-400">Envío</span>
                <span className="text-white">${order.shippingCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-400">Impuestos</span>
                <span className="text-white">${order.taxAmount.toFixed(2)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">Descuento</span>
                  <span className="text-green-500">-${order.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-neutral-800">
                <span className="text-white">Total</span>
                <span className="text-primary">${order.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Status History */}
          <div className="bg-[#1A1A1A] border border-neutral-800 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Historial de Estados</h2>
            
            <div className="space-y-4">
              {order.statusHistory.map((history, index) => {
                const config = getStatusConfig(history.status);
                const HistoryIcon = config.icon;

                return (
                  <div key={history.id} className="flex items-start space-x-4">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-black border-2 border-neutral-800 flex items-center justify-center">
                        <HistoryIcon className="w-5 h-5 text-primary" />
                      </div>
                      {index < order.statusHistory.length - 1 && (
                        <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-neutral-800" style={{ height: '40px' }} />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium px-3 py-1 rounded-full ${config.color}`}>
                          {config.label}
                        </span>
                        <span className="text-sm text-neutral-500">
                          {formatDate(history.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-400 mt-2">{history.notes}</p>
                      <p className="text-xs text-neutral-600 mt-1">Por: {history.createdBy}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-[#1A1A1A] border border-neutral-800 rounded-xl p-6">
            <div className="flex items-center space-x-2 mb-4">
              <User className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-white">Cliente</h2>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-neutral-400">Nombre</p>
                <p className="text-sm font-medium text-white">{order.customer.name}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-400">Email</p>
                <p className="text-sm font-medium text-white">{order.customer.email}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-400">Teléfono</p>
                <p className="text-sm font-medium text-white">{order.customer.phone}</p>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-[#1A1A1A] border border-neutral-800 rounded-xl p-6">
            <div className="flex items-center space-x-2 mb-4">
              <MapPin className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-white">Dirección de Envío</h2>
            </div>
            
            <div className="text-sm space-y-1">
              <p className="font-medium text-white">{order.shippingAddress.fullName}</p>
              <p className="text-neutral-400">{order.shippingAddress.streetAddress}</p>
              <p className="text-neutral-400">
                {order.shippingAddress.city}, {order.shippingAddress.state}
              </p>
              <p className="text-neutral-400">{order.shippingAddress.postalCode}</p>
              <p className="text-neutral-400">{order.shippingAddress.country}</p>
              <p className="text-neutral-400 mt-2">{order.shippingAddress.phone}</p>
            </div>
          </div>

          {/* Shipping Method */}
          <div className="bg-[#1A1A1A] border border-neutral-800 rounded-xl p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Truck className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-white">Método de Envío</h2>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-400">Método</span>
                <span className="text-white">{order.shippingMethod.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-400">Costo</span>
                <span className="text-white">${order.shippingMethod.cost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-400">Estimado</span>
                <span className="text-white">{order.shippingMethod.estimatedDays}</span>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-[#1A1A1A] border border-neutral-800 rounded-xl p-6">
            <div className="flex items-center space-x-2 mb-4">
              <CreditCard className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-white">Información de Pago</h2>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-neutral-400">Estado del Pago</p>
                <span className="inline-block mt-1 px-3 py-1 bg-green-500/10 text-green-500 text-xs font-medium rounded-full">
                  {order.paymentStatus}
                </span>
              </div>
              <div>
                <p className="text-sm text-neutral-400">Método</p>
                <p className="text-sm font-medium text-white">{order.paymentMethod}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-400">ID de Transacción</p>
                <p className="text-xs font-mono text-neutral-500">{order.paymentId}</p>
              </div>
              {order.paidAt && (
                <div>
                  <p className="text-sm text-neutral-400">Fecha de Pago</p>
                  <p className="text-sm font-medium text-white">{formatDate(order.paidAt)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Update Status */}
          <div className="bg-[#1A1A1A] border border-neutral-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Actualizar Estado</h2>
              {!isEditingStatus && (
                <button
                  onClick={() => setIsEditingStatus(true)}
                  className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4 text-primary" />
                </button>
              )}
            </div>

            {isEditingStatus ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Nuevo Estado
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-4 py-2 bg-black border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-primary"
                  >
                    <option value="">Selecciona un estado</option>
                    <option value="PROCESSING">Procesando</option>
                    <option value="SHIPPED">Enviado</option>
                    <option value="DELIVERED">Entregado</option>
                    <option value="CANCELLED">Cancelado</option>
                  </select>
                </div>

                {newStatus === 'SHIPPED' && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Número de Seguimiento
                    </label>
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      className="w-full px-4 py-2 bg-black border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-primary"
                      placeholder="TRK123456789"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Notas (opcional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 bg-black border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-primary resize-none"
                    placeholder="Agrega notas sobre este cambio..."
                  />
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={handleStatusUpdate}
                    className="flex-1 inline-flex items-center justify-center space-x-2 px-4 py-2 bg-primary text-black font-semibold rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>Guardar</span>
                  </button>
                  <button
                    onClick={() => setIsEditingStatus(false)}
                    className="px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-neutral-400">
                Haz clic en el ícono de editar para actualizar el estado del pedido
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetail;
