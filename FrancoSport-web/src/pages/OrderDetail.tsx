import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Container } from '@/components/layout/Container';
import { Button, Card, Badge } from '@/components/ui';
import { ArrowLeft, Package, MapPin, CreditCard, Calendar, Truck } from 'lucide-react';
import { getOrder } from '@/api/orders.service';
import { ROUTES, generateRoute } from '@/constants/routes';
import type { Order } from '@/types';
import toast from 'react-hot-toast';

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadOrder(id);
    }
  }, [id]);

  const loadOrder = async (orderId: string) => {
    try {
      setIsLoading(true);
      const data = await getOrder(orderId);
      setOrder(data);
    } catch (error) {
      console.error('Error loading order:', error);
      toast.error('Error al cargar el pedido');
      navigate(ROUTES.PROFILE);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="py-12 bg-background min-h-screen">
      <Container>
        <div className="mb-6">
          <Link to={ROUTES.PROFILE} className="inline-flex items-center text-text-secondary hover:text-primary transition-colors mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Volver a mis pedidos
          </Link>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                Pedido #{order.order_number}
                <Badge variant={
                  order.status === 'DELIVERED' ? 'success' :
                  order.status === 'CANCELLED' ? 'danger' :
                  'warning'
                }>
                  {order.status}
                </Badge>
              </h1>
              <p className="text-text-secondary mt-1 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Realizado el {new Date(order.created_at).toLocaleDateString()} a las {new Date(order.created_at).toLocaleTimeString()}
              </p>
            </div>
            
            {order.status === 'PENDING' && (
              <Button variant="danger" size="sm">
                Cancelar Pedido
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Items */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Package className="text-primary" /> Productos ({order.items.length})
              </h2>
              <div className="divide-y divide-border">
                {order.items.map((item) => (
                  <div key={item.id} className="py-4 flex gap-4">
                    <Link to={generateRoute.productDetail(item.product?.slug || '')} className="shrink-0">
                      <img 
                        src={item.product?.images[0]?.url || '/placeholder.png'} 
                        alt={item.product_name}
                        className="w-20 h-20 object-cover rounded-md border border-border"
                      />
                    </Link>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <Link 
                            to={generateRoute.productDetail(item.product?.slug || '')}
                            className="font-bold text-lg hover:text-primary transition-colors"
                          >
                            {item.product_name}
                          </Link>
                          {item.variant_name && (
                            <p className="text-sm text-text-secondary">{item.variant_name}</p>
                          )}
                        </div>
                        <p className="font-bold text-lg">${item.subtotal.toFixed(2)}</p>
                      </div>
                      <div className="mt-2 flex justify-between items-center">
                        <span className="text-sm text-text-secondary">
                          Cantidad: {item.quantity} x ${item.price_at_purchase.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Timeline / Status History (Optional) */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Truck className="text-primary" /> Seguimiento
              </h2>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                    <div className="w-0.5 h-full bg-primary/20"></div>
                  </div>
                  <div className="pb-6">
                    <p className="font-bold">Pedido Realizado</p>
                    <p className="text-sm text-text-secondary">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                {/* More steps could be added here based on status_history */}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Summary */}
            <Card className="p-6">
              <h2 className="text-lg font-bold mb-4">Resumen</h2>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between text-text-secondary">
                  <span>Subtotal</span>
                  <span>${order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>Envío</span>
                  <span>${order.shipping_cost.toFixed(2)}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Descuento</span>
                    <span>-${order.discount_amount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-border pt-2 flex justify-between font-bold text-lg text-primary">
                  <span>Total</span>
                  <span>${order.total_amount.toFixed(2)}</span>
                </div>
              </div>
            </Card>

            {/* Shipping Info */}
            <Card className="p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" /> Envío
              </h2>
              {order.shipping_address ? (
                <div className="text-sm space-y-1">
                  <p className="font-bold">{order.shipping_address.full_name}</p>
                  <p>{order.shipping_address.street_address}</p>
                  <p>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}</p>
                  <p>{order.shipping_address.country}</p>
                  <p className="mt-2 text-text-secondary">Tel: {order.shipping_address.phone}</p>
                </div>
              ) : (
                <p className="text-sm text-text-secondary">No hay información de envío</p>
              )}
            </Card>

            {/* Payment Info */}
            <Card className="p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" /> Pago
              </h2>
              <div className="text-sm">
                <p className="font-bold mb-1">Método de Pago</p>
                <p className="text-text-secondary mb-3">
                  {order.payment_method === 'CASH_ON_DELIVERY' ? 'Pago contra entrega' : order.payment_method}
                </p>
                <p className="font-bold mb-1">Estado del Pago</p>
                <Badge variant={order.payment_status === 'PAID' ? 'success' : 'warning'} size="sm">
                  {order.payment_status}
                </Badge>
              </div>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default OrderDetail;
