import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from '@/components/layout/Container';
import { Button, Card, Input } from '@/components/ui';
import { Loader2, Check, CreditCard, Truck, MapPin, QrCode, Upload, X, Award } from 'lucide-react';
import { useCartStore, useAuthStore } from '@/store';
import { getAddresses, createAddress } from '@/api/users.service';
import { createOrder } from '@/api/orders.service';
import { uploadImage } from '@/api/upload.service';
import { ROUTES } from '@/constants/routes';
import type { Address } from '@/types';
import toast from 'react-hot-toast';
import { logBeginCheckout, logPurchase } from '@/api/analytics.service';

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { items, subtotal, clearCart } = useCartStore();
  const { isAuthenticated, user } = useAuthStore();

  const [step, setStep] = useState<'address' | 'payment' | 'review'>('address');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'CASH_ON_DELIVERY' | 'QR_TRANSFER'>('CASH_ON_DELIVERY');
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null);

  // Loyalty Points
  const [redeemPoints, setRedeemPoints] = useState(0);
  const pointsValue = redeemPoints / 100; // 100 points = $1
  const maxRedeemablePoints = user ? Math.min(user.loyalty_points, Math.floor(subtotal * 100)) : 0;

  // New Address Form
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState<any>({
    address_type: 'SHIPPING',
    full_name: '',
    street_address: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'Bolivia',
    phone: ''
  });

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Debes iniciar sesión para continuar');
      navigate(ROUTES.LOGIN);
      return;
    }

    if (items.length === 0) {
      navigate(ROUTES.CART);
      return;
    }

    if (user) {
      setNewAddress((prev: any) => ({ ...prev, full_name: `${user.first_name} ${user.last_name}` }));
    }

    // Track begin_checkout
    logBeginCheckout(items, subtotal);

    loadAddresses();
  }, [isAuthenticated, items, navigate, user]);

  const loadAddresses = async () => {
    try {
      setIsLoadingAddresses(true);
      const data = await getAddresses();
      setAddresses(data);
      if (data.length > 0) {
        setSelectedAddressId(data[0].id);
      } else {
        setShowAddressForm(true);
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
      toast.error('Error al cargar direcciones');
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await createAddress(newAddress);
      setAddresses([...addresses, created]);
      setSelectedAddressId(created.id);
      setShowAddressForm(false);
      toast.success('Dirección agregada');
    } catch (error) {
      console.error('Error creating address:', error);
      toast.error('Error al crear dirección');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPaymentProof(file);
      setPaymentProofPreview(URL.createObjectURL(file));
    }
  };

  const removePaymentProof = () => {
    setPaymentProof(null);
    setPaymentProofPreview(null);
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      toast.error('Selecciona una dirección de envío');
      return;
    }

    if (paymentMethod === 'QR_TRANSFER' && !paymentProof) {
      toast.error('Debes subir el comprobante de pago');
      return;
    }

    try {
      setIsPlacingOrder(true);
      
      let paymentProofUrl = '';

      if (paymentMethod === 'QR_TRANSFER' && paymentProof) {
        try {
          const uploadResult = await uploadImage(paymentProof);
          paymentProofUrl = uploadResult.url;
        } catch (uploadError) {
          console.error('Error uploading proof:', uploadError);
          toast.error('Error al subir el comprobante. Intenta de nuevo.');
          setIsPlacingOrder(false);
          return;
        }
      }
      
      const orderData = {
        items: items.map(item => ({
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity
        })),
        shipping_address_id: selectedAddressId,
        payment_method: paymentMethod === 'QR_TRANSFER' ? 'BANK_TRANSFER' : 'CASH_ON_DELIVERY',
        shipping_method_id: 1, // Hardcoded for now
        payment_proof_url: paymentProofUrl || undefined,
        redeem_points: redeemPoints > 0 ? redeemPoints : undefined
      };

      const newOrder = await createOrder(orderData);
      
      // Track purchase
      logPurchase(newOrder.id.toString(), items, subtotal - pointsValue);

      clearCart();
      toast.success('¡Pedido realizado con éxito!');
      navigate(ROUTES.HOME); // Ideally redirect to order success page
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Error al procesar el pedido');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="py-12 bg-background min-h-screen">
      <Container>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center">Finalizar Compra</h1>

          {/* Steps Indicator */}
          <div className="flex justify-center mb-12">
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step === 'address' ? 'bg-primary text-white' : 'bg-green-500 text-white'}`}>
                {step === 'address' ? '1' : <Check className="w-6 h-6" />}
              </div>
              <div className={`w-20 h-1 ${step === 'address' ? 'bg-surface-lighter' : 'bg-green-500'}`} />
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step === 'payment' ? 'bg-primary text-white' : step === 'review' ? 'bg-green-500 text-white' : 'bg-surface-lighter text-text-tertiary'}`}>
                {step === 'payment' ? '2' : step === 'review' ? <Check className="w-6 h-6" /> : '2'}
              </div>
              <div className={`w-20 h-1 ${step === 'review' ? 'bg-green-500' : 'bg-surface-lighter'}`} />
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step === 'review' ? 'bg-primary text-white' : 'bg-surface-lighter text-text-tertiary'}`}>
                3
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form Area */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Step 1: Address */}
              {step === 'address' && (
                <Card className="p-6">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <MapPin className="text-primary" /> Dirección de Envío
                  </h2>

                  {isLoadingAddresses ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {addresses.map((addr) => (
                        <div 
                          key={addr.id}
                          onClick={() => setSelectedAddressId(addr.id)}
                          className={`p-4 border rounded-lg cursor-pointer transition-all ${
                            selectedAddressId === addr.id 
                              ? 'border-primary bg-primary/5' 
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-bold">{addr.full_name}</p>
                              <p className="text-sm text-text-secondary">{addr.street_address}</p>
                              <p className="text-sm text-text-secondary">
                                {addr.city}, {addr.state} {addr.postal_code}
                              </p>
                              <p className="text-sm text-text-secondary">{addr.country}</p>
                              <p className="text-sm text-text-secondary mt-1">Tel: {addr.phone}</p>
                            </div>
                            {selectedAddressId === addr.id && (
                              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                      {!showAddressForm ? (
                        <Button variant="outline" onClick={() => setShowAddressForm(true)} fullWidth>
                          + Agregar Nueva Dirección
                        </Button>
                      ) : (
                        <form onSubmit={handleCreateAddress} className="space-y-4 border-t border-border pt-4 mt-4">
                          <h3 className="font-bold text-sm">Nueva Dirección</h3>
                          <Input
                            label="Nombre Completo"
                            value={newAddress.full_name}
                            onChange={(e) => setNewAddress({...newAddress, full_name: e.target.value})}
                            required
                          />
                          <Input
                            label="Dirección"
                            value={newAddress.street_address}
                            onChange={(e) => setNewAddress({...newAddress, street_address: e.target.value})}
                            required
                          />
                          <div className="grid grid-cols-2 gap-4">
                            <Input
                              label="Ciudad"
                              value={newAddress.city}
                              onChange={(e) => setNewAddress({...newAddress, city: e.target.value})}
                              required
                            />
                            <Input
                              label="Estado/Provincia"
                              value={newAddress.state}
                              onChange={(e) => setNewAddress({...newAddress, state: e.target.value})}
                              required
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <Input
                              label="Código Postal"
                              value={newAddress.postal_code}
                              onChange={(e) => setNewAddress({...newAddress, postal_code: e.target.value})}
                              required
                            />
                            <Input
                              label="Teléfono"
                              value={newAddress.phone}
                              onChange={(e) => setNewAddress({...newAddress, phone: e.target.value})}
                              required
                            />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button variant="ghost" onClick={() => setShowAddressForm(false)}>Cancelar</Button>
                            <Button type="submit">Guardar Dirección</Button>
                          </div>
                        </form>
                      )}

                      <div className="flex justify-end mt-6">
                        <Button 
                          onClick={() => setStep('payment')}
                          disabled={!selectedAddressId}
                        >
                          Continuar al Pago
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              )}

              {/* Step 2: Payment */}
              {step === 'payment' && (
                <Card className="p-6">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <CreditCard className="text-primary" /> Método de Pago
                  </h2>
                  
                  <div className="space-y-4 mb-6">
                    {/* Cash on Delivery */}
                    <div 
                      onClick={() => setPaymentMethod('CASH_ON_DELIVERY')}
                      className={`p-4 border rounded-lg flex items-center gap-4 cursor-pointer transition-all ${
                        paymentMethod === 'CASH_ON_DELIVERY'
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        paymentMethod === 'CASH_ON_DELIVERY' ? 'border-primary bg-primary' : 'border-text-tertiary'
                      }`}>
                        {paymentMethod === 'CASH_ON_DELIVERY' && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <div>
                        <p className="font-bold">Pago contra entrega</p>
                        <p className="text-sm text-text-secondary">Paga en efectivo al recibir tu pedido</p>
                      </div>
                    </div>

                    {/* QR Transfer */}
                    <div 
                      onClick={() => setPaymentMethod('QR_TRANSFER')}
                      className={`p-4 border rounded-lg flex items-start gap-4 cursor-pointer transition-all ${
                        paymentMethod === 'QR_TRANSFER'
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center mt-1 ${
                        paymentMethod === 'QR_TRANSFER' ? 'border-primary bg-primary' : 'border-text-tertiary'
                      }`}>
                        {paymentMethod === 'QR_TRANSFER' && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <QrCode className="w-5 h-5 text-primary" />
                          <p className="font-bold">Transferencia QR</p>
                        </div>
                        <p className="text-sm text-text-secondary mb-4">Escanea el código QR y sube tu comprobante</p>
                        
                        {paymentMethod === 'QR_TRANSFER' && (
                          <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-4">
                            <div className="flex justify-center bg-white p-4 rounded-lg border border-border max-w-xs mx-auto">
                              <img 
                                src="/assets/qr-payment.jpg" 
                                alt="Código QR para pago" 
                                className="w-full h-auto object-contain"
                              />
                            </div>
                            
                            <div className="border-t border-border pt-4">
                              <label className="block text-sm font-medium mb-2">
                                Subir Comprobante de Pago
                              </label>
                              
                              {!paymentProof ? (
                                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:bg-surface-light transition-colors relative">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                  />
                                  <Upload className="w-8 h-8 mx-auto text-text-tertiary mb-2" />
                                  <p className="text-sm text-text-secondary">
                                    Haz clic o arrastra la imagen aquí
                                  </p>
                                </div>
                              ) : (
                                <div className="relative rounded-lg overflow-hidden border border-border">
                                  <img 
                                    src={paymentProofPreview!} 
                                    alt="Comprobante" 
                                    className="w-full h-48 object-cover"
                                  />
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removePaymentProof();
                                    }}
                                    className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-red-500 transition-colors"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                  <div className="p-2 bg-surface-light text-xs text-center truncate">
                                    {paymentProof.name}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-4 border border-border rounded-lg flex items-center gap-4 opacity-50 cursor-not-allowed">
                      <div className="w-5 h-5 rounded-full border border-text-tertiary" />
                      <div>
                        <p className="font-bold">Tarjeta de Crédito / Débito</p>
                        <p className="text-sm text-text-secondary">Próximamente</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button variant="ghost" onClick={() => setStep('address')}>Atrás</Button>
                    <Button 
                      onClick={() => setStep('review')}
                      disabled={paymentMethod === 'QR_TRANSFER' && !paymentProof}
                    >
                      Revisar Pedido
                    </Button>
                  </div>
                </Card>
              )}

              {/* Step 3: Review */}
              {step === 'review' && (
                <Card className="p-6">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Truck className="text-primary" /> Revisar y Confirmar
                  </h2>

                  <div className="space-y-6">
                    <div className="bg-surface-light p-4 rounded-lg">
                      <h3 className="font-bold mb-2 text-sm uppercase tracking-wider text-text-secondary">Dirección de Envío</h3>
                      {addresses.find(a => a.id === selectedAddressId) && (
                        <div className="text-sm">
                          <p>{addresses.find(a => a.id === selectedAddressId)?.full_name}</p>
                          <p>{addresses.find(a => a.id === selectedAddressId)?.street_address}</p>
                          <p>{addresses.find(a => a.id === selectedAddressId)?.city}, {addresses.find(a => a.id === selectedAddressId)?.state}</p>
                          <p>Tel: {addresses.find(a => a.id === selectedAddressId)?.phone}</p>
                        </div>
                      )}
                    </div>

                    <div className="bg-surface-light p-4 rounded-lg">
                      <h3 className="font-bold mb-2 text-sm uppercase tracking-wider text-text-secondary">Método de Pago</h3>
                      <p className="text-sm font-medium">
                        {paymentMethod === 'CASH_ON_DELIVERY' ? 'Pago contra entrega' : 'Transferencia QR'}
                      </p>
                      {paymentMethod === 'QR_TRANSFER' && paymentProof && (
                        <div className="mt-2 text-xs text-green-500 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Comprobante subido
                        </div>
                      )}
                    </div>

                    <div className="bg-surface-light p-4 rounded-lg">
                      <h3 className="font-bold mb-2 text-sm uppercase tracking-wider text-text-secondary">Productos</h3>
                      <div className="space-y-2">
                        {items.map(item => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span>{item.quantity}x {item.product?.name}</span>
                            <span className="font-medium">${item.subtotal.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between mt-8">
                    <Button variant="ghost" onClick={() => setStep('payment')}>Atrás</Button>
                    <Button 
                      size="lg" 
                      onClick={handlePlaceOrder} 
                      isLoading={isPlacingOrder}
                    >
                      Confirmar Pedido
                    </Button>
                  </div>
                </Card>
              )}
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <Card className="p-6 sticky top-24">
                <h2 className="text-lg font-bold mb-4">Resumen</h2>
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between text-text-secondary">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-text-secondary">
                    <span>Envío</span>
                    <span>$0.00</span>
                  </div>
                  
                  {/* Loyalty Points Redemption */}
                  {user && user.loyalty_points > 0 && (
                    <div className="py-4 border-t border-b border-border my-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="w-4 h-4 text-yellow-500" />
                        <span className="font-bold text-sm">Canjear Puntos</span>
                      </div>
                      <p className="text-xs text-text-secondary mb-2">
                        Tienes {user.loyalty_points} puntos. 
                        {maxRedeemablePoints < user.loyalty_points && " (Máximo canjeable por el total)"}
                      </p>
                      <div className="flex items-center gap-2">
                        <input 
                          type="range" 
                          min="0" 
                          max={maxRedeemablePoints} 
                          step="100"
                          value={redeemPoints}
                          onChange={(e) => setRedeemPoints(Number(e.target.value))}
                          className="w-full accent-primary"
                        />
                      </div>
                      <div className="flex justify-between text-xs mt-1">
                        <span>0</span>
                        <span className="font-bold text-primary">{redeemPoints} pts (-${pointsValue.toFixed(2)})</span>
                      </div>
                    </div>
                  )}

                  {redeemPoints > 0 && (
                    <div className="flex justify-between text-green-600 font-medium">
                      <span>Descuento (Puntos)</span>
                      <span>-${pointsValue.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="border-t border-border pt-2 flex justify-between font-bold text-lg text-primary">
                    <span>Total</span>
                    <span>${(subtotal - pointsValue).toFixed(2)}</span>
                  </div>
                </div>
                <div className="text-xs text-text-tertiary text-center">
                  Al confirmar el pedido, aceptas nuestros términos y condiciones.
                </div>
              </Card>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default Checkout;
