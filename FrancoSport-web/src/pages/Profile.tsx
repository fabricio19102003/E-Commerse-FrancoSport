import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Container } from '@/components/layout/Container';
import { Button, Card, Input } from '@/components/ui';
import { User, Package, LogOut, Save, Loader2, Award, Bell } from 'lucide-react';
import { useAuthStore } from '@/store';
import { updateProfile } from '@/api/users.service';
import { getOrders } from '@/api/orders.service';
import { loyaltyService } from '@/api/loyalty.service';
import { notificationsService } from '@/api/notifications.service';
import type { PointsHistoryResponse } from '@/api/loyalty.service';
import { ROUTES } from '@/constants/routes';
import type { Order } from '@/types';
import toast from 'react-hot-toast';

import { useSearchParams } from 'react-router-dom';

const Profile: React.FC = () => {
  const { user, logout, setUser } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'points'>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [pointsData, setPointsData] = useState<PointsHistoryResponse | null>(null);
  const [isLoadingPoints, setIsLoadingPoints] = useState(false);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'orders') {
      setActiveTab('orders');
    } else if (tab === 'points') {
      setActiveTab('points');
    } else {
      setActiveTab('profile');
    }
  }, [searchParams]);

  const handleTabChange = (tab: 'profile' | 'orders' | 'points') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Profile Form State
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone || '',
        email: user.email
      });
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'orders') {
      loadOrders();
    } else if (activeTab === 'points') {
      loadPoints();
    }
  }, [activeTab]);

  const loadOrders = async () => {
    try {
      setIsLoadingOrders(true);
      const data = await getOrders();
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Error al cargar pedidos');
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const loadPoints = async () => {
    try {
      setIsLoadingPoints(true);
      const data = await loyaltyService.getHistory();
      setPointsData(data);
    } catch (error) {
      console.error('Error loading points:', error);
      toast.error('Error al cargar puntos');
    } finally {
      setIsLoadingPoints(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const updatedUser = await updateProfile({
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone
      });
      setUser(updatedUser);
      toast.success('Perfil actualizado correctamente');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error al actualizar perfil');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="py-12 bg-background min-h-screen">
      <Container>
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-64 shrink-0">
            <Card className="p-4">
              <div className="flex flex-col items-center mb-6">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <span className="text-2xl font-bold text-primary">
                    {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                  </span>
                </div>
                <h2 className="font-bold text-lg">{user.first_name} {user.last_name}</h2>
                <p className="text-sm text-text-secondary">{user.email}</p>
                {user.loyalty_points > 0 && (
                  <div className="mt-2 bg-yellow-500/10 text-yellow-500 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    {user.loyalty_points} Puntos
                  </div>
                )}
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-4 text-xs"
                  leftIcon={<Bell className="w-3 h-3" />}
                  onClick={() => {
                    notificationsService.subscribeToPush()
                      .then(() => toast.success('Notificaciones activadas'))
                      .catch(() => toast.error('No se pudieron activar las notificaciones'));
                  }}
                >
                  Activar Notificaciones
                </Button>
              </div>

              <nav className="space-y-1">
                <button
                  onClick={() => handleTabChange('profile')}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-md transition-colors ${
                    activeTab === 'profile' 
                      ? 'bg-primary text-white' 
                      : 'text-text-secondary hover:bg-surface-light'
                  }`}
                >
                  <User className="w-4 h-4" /> Mi Perfil
                </button>
                <button
                  onClick={() => handleTabChange('orders')}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-md transition-colors ${
                    activeTab === 'orders' 
                      ? 'bg-primary text-white' 
                      : 'text-text-secondary hover:bg-surface-light'
                  }`}
                >
                  <Package className="w-4 h-4" /> Mis Pedidos
                </button>
                <button
                  onClick={() => handleTabChange('points')}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-md transition-colors ${
                    activeTab === 'points' 
                      ? 'bg-primary text-white' 
                      : 'text-text-secondary hover:bg-surface-light'
                  }`}
                >
                  <Award className="w-4 h-4" /> Mis Puntos
                </button>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-2 rounded-md text-red-500 hover:bg-red-50 transition-colors mt-4"
                >
                  <LogOut className="w-4 h-4" /> Cerrar Sesión
                </button>
              </nav>
            </Card>
          </div>

          {/* Content */}
          <div className="flex-1">
            {activeTab === 'profile' && (
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-6">Información Personal</h2>
                <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Nombre"
                      value={formData.first_name}
                      onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                      required
                    />
                    <Input
                      label="Apellido"
                      value={formData.last_name}
                      onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                      required
                    />
                  </div>
                  <Input
                    label="Email"
                    value={formData.email}
                    disabled
                    helperText="El email no se puede cambiar"
                  />
                  <Input
                    label="Teléfono"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                  
                  <div className="pt-4">
                    <Button 
                      type="submit" 
                      isLoading={isLoading}
                      leftIcon={<Save className="w-4 h-4" />}
                    >
                      Guardar Cambios
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {activeTab === 'orders' && (
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-6">Mis Pedidos</h2>
                
                {isLoadingOrders ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="animate-spin text-primary w-8 h-8" />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 text-text-tertiary mx-auto mb-4 opacity-20" />
                    <h3 className="text-lg font-bold mb-2">No tienes pedidos aún</h3>
                    <p className="text-text-secondary mb-6">
                      ¡Explora nuestros productos y realiza tu primera compra!
                    </p>
                    <Link to={ROUTES.PRODUCTS}>
                      <Button variant="primary">Ir a la Tienda</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="border border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
                          <div>
                            <p className="font-bold text-lg">Pedido #{order.order_number}</p>
                            <p className="text-sm text-text-secondary">
                              {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                              order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {order.status}
                            </span>
                            <span className="font-bold text-lg text-primary">
                              ${order.total_amount.toFixed(2)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="border-t border-border pt-4">
                          <div className="flex flex-wrap gap-2">
                            {order.items.slice(0, 3).map((item) => (
                              <div key={item.id} className="relative group">
                                <img 
                                  src={item.product?.images[0]?.url || '/placeholder.png'} 
                                  alt={item.product_name}
                                  className="w-12 h-12 object-cover rounded-md border border-border"
                                  title={item.product_name}
                                />
                                <span className="absolute -top-2 -right-2 bg-surface-dark text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
                                  {item.quantity}
                                </span>
                              </div>
                            ))}
                            {order.items.length > 3 && (
                              <div className="w-12 h-12 rounded-md bg-surface-light flex items-center justify-center text-xs font-bold text-text-secondary border border-border">
                                +{order.items.length - 3}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {activeTab === 'points' && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Mis Puntos de Lealtad</h2>
                  <div className="bg-yellow-500/10 text-yellow-500 px-4 py-2 rounded-lg font-bold flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    {pointsData?.current_points || 0} Puntos
                  </div>
                </div>

                <div className="bg-surface-light p-4 rounded-lg mb-6">
                  <h3 className="font-bold mb-2">¿Cómo funciona?</h3>
                  <ul className="list-disc list-inside text-sm text-text-secondary space-y-1">
                    <li>Gana <strong>1 punto</strong> por cada $1 gastado en tus compras.</li>
                    <li>Canjea tus puntos en el checkout para obtener descuentos.</li>
                    <li><strong>100 puntos = $1 de descuento.</strong></li>
                  </ul>
                </div>

                {isLoadingPoints ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="animate-spin text-primary w-8 h-8" />
                  </div>
                ) : !pointsData || pointsData.history.length === 0 ? (
                  <div className="text-center py-12 text-text-tertiary">
                    <Award className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p>Aún no tienes historial de puntos.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="p-3 font-semibold text-sm text-text-secondary">Fecha</th>
                          <th className="p-3 font-semibold text-sm text-text-secondary">Descripción</th>
                          <th className="p-3 font-semibold text-sm text-text-secondary text-right">Puntos</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pointsData.history.map((transaction) => (
                          <tr key={transaction.id} className="border-b border-border/50 hover:bg-surface-light/50">
                            <td className="p-3 text-sm">
                              {new Date(transaction.created_at).toLocaleDateString()}
                            </td>
                            <td className="p-3 text-sm">
                              {transaction.description}
                              {transaction.order && (
                                <span className="text-xs text-text-tertiary block">
                                  Pedido: {transaction.order.order_number}
                                </span>
                              )}
                            </td>
                            <td className={`p-3 text-sm font-bold text-right ${
                              transaction.points > 0 ? 'text-green-500' : 'text-red-500'
                            }`}>
                              {transaction.points > 0 ? '+' : ''}{transaction.points}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
};

export default Profile;
