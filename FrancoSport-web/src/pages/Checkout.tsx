import React, { useEffect, useRef, useState } from 'react';
import { formatCurrency } from '@/utils/currency';
import { paymentMethodLabel } from '@/constants/labels';
import { useNavigate } from 'react-router-dom';
import { Container } from '@/components/layout/Container';
import { Button, Card, Input } from '@/components/ui';
import { Loader2, Check, CreditCard, Truck, MapPin, QrCode, Upload, X, Award, Tag } from 'lucide-react';
import { useCartStore, useAuthStore } from '@/store';
import { getAddresses, createAddress } from '@/api/users.service';
import { createOrder } from '@/api/orders.service';
import { validateCoupon } from '@/api/coupons.service';
import { getShippingMethods } from '@/api/shipping.service';
import axios from 'axios';
import { getErrorMessage } from '@/api/axios';
import { ROUTES, generateRoute } from '@/constants/routes';
import type { Address, AvailableShippingMethod, CouponPreview } from '@/types';
import toast from 'react-hot-toast';
import { logBeginCheckout, logPurchase } from '@/api/analytics.service';
import { paymentService } from '@/api/payment.service';
import type { PaymentConfig } from '@/api/payment.service';

// The delivery time is shown from the method's day range; hide a description that repeats it ("Entrega en 3-5 días hábiles")
const restatesDeliveryDays = (description: string) => /\d\s*(-\s*\d+\s*)?d[ií]as/i.test(description);

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const orderPlacedRef = useRef(false);
  const { items, subtotal, clearCart } = useCartStore();
  const { isAuthenticated, user, updateUser } = useAuthStore();

  const [step, setStep] = useState<'address' | 'payment' | 'review'>('address');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Shipping State
  const [shippingMethods, setShippingMethods] = useState<AvailableShippingMethod[]>([]);
  const [selectedShippingMethodId, setSelectedShippingMethodId] = useState<number | null>(null);
  const [isLoadingShipping, setIsLoadingShipping] = useState(false);

  // Same formula the server uses: base cost + cost per kg × total weight (the server is the source of truth)
  const totalWeight = items.reduce((sum, item) => sum + Number(item.product?.weight || 0) * item.quantity, 0);
  const selectedShippingMethod = shippingMethods.find((m) => m.id === selectedShippingMethodId) || null;
  const shippingCost = selectedShippingMethod
    ? Math.round((Number(selectedShippingMethod.base_cost) + Number(selectedShippingMethod.cost_per_kg) * totalWeight) * 100) / 100
    : 0;

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'CASH_ON_DELIVERY' | 'QR_TRANSFER'>('CASH_ON_DELIVERY');
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null);
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);

  // Coupon: validated by the API for this cart; a coupon or points, never both
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponPreview | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const cartKey = items.map((item) => `${item.product_id}:${item.variant_id ?? ''}:${item.quantity}`).join('|');
  const appliedCartKeyRef = useRef('');
  const appliedShippingMethodRef = useRef<number | null>(null);
  const couponDiscount = appliedCoupon ? Number(appliedCoupon.discount_amount) : 0;
  const isShippingCoupon = appliedCoupon?.applies_to === 'SHIPPING';
  // With a shipping coupon the shipping cost is the one the server used for the discount, i.e. the one it charges
  const orderShipping = isShippingCoupon && appliedCoupon?.shipping_cost != null ? Number(appliedCoupon.shipping_cost) : shippingCost;
  // With a coupon the subtotal is the one the server used for the discount, i.e. the one it charges
  const orderSubtotal = appliedCoupon ? Number(appliedCoupon.subtotal) : subtotal;

  // Loyalty Points
  const [redeemPoints, setRedeemPoints] = useState(0);
  const pointsValue = redeemPoints / 100; // 100 points = Bs. 1
  const maxRedeemablePoints = user ? Math.min(user.loyalty_points, Math.round((subtotal + shippingCost) * 100)) : 0;
  const orderTotal = orderSubtotal + orderShipping - couponDiscount - pointsValue;

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

    // After a placed order the cart is emptied on purpose: do not bounce to the cart
    if (items.length === 0 && !orderPlacedRef.current) {
      navigate(ROUTES.CART);
      return;
    }

    if (user) {
      setNewAddress((prev: any) => ({ ...prev, full_name: `${user.first_name} ${user.last_name}` }));
    }

    // Track begin_checkout
    logBeginCheckout(items, subtotal);

    loadAddresses();
    loadShippingMethods();
    fetchPaymentConfig();
  }, [isAuthenticated, items, navigate, user]);

  const loadShippingMethods = async () => {
    try {
      setIsLoadingShipping(true);
      const data = await getShippingMethods();
      setShippingMethods(data);
      // Keep the customer's choice if it is still available, otherwise default to the first
      setSelectedShippingMethodId((current) =>
        current !== null && data.some((m) => m.id === current) ? current : data[0]?.id ?? null
      );
    } catch (error) {
      console.error('Error loading shipping methods:', error);
      toast.error('Error al cargar los métodos de envío');
    } finally {
      setIsLoadingShipping(false);
    }
  };

  const fetchPaymentConfig = async () => {
    try {
      const response = await paymentService.getPaymentConfig();
      if (response.success) {
        setPaymentConfig(response.data);
      }
    } catch (error) {
      console.error('Error fetching payment config:', error);
    }
  };

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

  const handleApplyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) {
      setCouponError('Ingrese el código del cupón');
      return;
    }
    try {
      setIsApplyingCoupon(true);
      setCouponError(null);
      const preview = await validateCoupon({
        code,
        // A free-shipping coupon discounts the cost of this shipping method
        shipping_method_id: selectedShippingMethodId ?? undefined,
        items: items.map((item) => ({
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity,
        })),
      });
      appliedCartKeyRef.current = cartKey;
      appliedShippingMethodRef.current = selectedShippingMethodId;
      setAppliedCoupon(preview);
      setRedeemPoints(0);
      setCouponInput(preview.code);
    } catch (error) {
      setAppliedCoupon(null);
      setCouponError(getErrorMessage(error) || 'No se pudo validar el cupón');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
    setCouponInput('');
  };

  // A discount computed for another cart is no longer the one the API would charge
  useEffect(() => {
    if (appliedCoupon && appliedCartKeyRef.current !== cartKey) {
      setAppliedCoupon(null);
      setCouponError('El carrito cambió: vuelva a aplicar el cupón');
    }
  }, [cartKey, appliedCoupon]);

  // A free-shipping discount computed for another shipping method is no longer the one the API would charge
  useEffect(() => {
    if (appliedCoupon?.applies_to === 'SHIPPING' && appliedShippingMethodRef.current !== selectedShippingMethodId) {
      setAppliedCoupon(null);
      setCouponError('El método de envío cambió: vuelva a aplicar el cupón');
    }
  }, [selectedShippingMethodId, appliedCoupon]);

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

    if (!selectedShippingMethodId) {
      toast.error('Selecciona un método de envío');
      return;
    }

    if (paymentMethod === 'QR_TRANSFER' && !paymentProof) {
      toast.error('Debes subir el comprobante de pago');
      return;
    }

    try {
      setIsPlacingOrder(true);
      
      const orderData = {
        items: items.map(item => ({
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity
        })),
        shipping_address_id: selectedAddressId,
        payment_method: paymentMethod === 'QR_TRANSFER' ? 'BANK_TRANSFER' : 'CASH_ON_DELIVERY',
        shipping_method_id: selectedShippingMethodId,
        redeem_points: !appliedCoupon && redeemPoints > 0 ? redeemPoints : undefined,
        coupon_code: appliedCoupon ? appliedCoupon.code : undefined
      };

      const newOrder = await createOrder(orderData);

      // The proof is uploaded to the order that was just created (only its owner can do it)
      let proofUploadFailed = false;
      if (paymentMethod === 'QR_TRANSFER' && paymentProof) {
        try {
          await paymentService.uploadPaymentProof(newOrder.id, paymentProof);
        } catch (uploadError) {
          console.error('Error uploading proof:', uploadError);
          proofUploadFailed = true;
        }
      }

      // Track purchase
      logPurchase(newOrder.id.toString(), items, orderTotal);

      orderPlacedRef.current = true;
      clearCart();
      if (proofUploadFailed) {
        // The order exists: send the customer to its detail page, where the proof can be uploaded again
        toast.error(
          'Su pedido fue creado, pero el comprobante no se pudo subir: súbalo desde el detalle del pedido',
          { duration: 10000 }
        );
        navigate(generateRoute.orderDetail(newOrder.order_number));
        return;
      }
      toast.success('¡Pedido realizado con éxito!');
      navigate(generateRoute.orderDetail(newOrder.order_number));
    } catch (error) {
      console.error('Error placing order:', error);
      // The email was marked unverified elsewhere (e.g. an admin changed it): show the notice with its resend button
      if (axios.isAxiosError(error) && error.response?.data?.error?.code === 'EMAIL_NOT_VERIFIED') {
        updateUser({ email_verified: false });
      }
      toast.error(getErrorMessage(error) || 'Error al procesar el pedido');
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

                      <div className="border-t border-border pt-4 mt-4">
                        <h3 className="font-bold mb-3 flex items-center gap-2">
                          <Truck className="text-primary w-5 h-5" /> Método de Envío
                        </h3>
                        {isLoadingShipping ? (
                          <div className="flex justify-center py-4">
                            <Loader2 className="animate-spin text-primary" />
                          </div>
                        ) : shippingMethods.length === 0 ? (
                          <p className="text-sm text-text-secondary">
                            No hay métodos de envío disponibles por el momento.
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {shippingMethods.map((method) => {
                              const methodCost =
                                Math.round((Number(method.base_cost) + Number(method.cost_per_kg) * totalWeight) * 100) / 100;
                              return (
                                <div
                                  key={method.id}
                                  onClick={() => setSelectedShippingMethodId(method.id)}
                                  className={`p-4 border rounded-lg flex items-center justify-between gap-4 cursor-pointer transition-all ${
                                    selectedShippingMethodId === method.id
                                      ? 'border-primary bg-primary/5'
                                      : 'border-border hover:border-primary/50'
                                  }`}
                                >
                                  <div>
                                    <p className="font-bold">{method.name}</p>
                                    {method.description && !restatesDeliveryDays(method.description) && (
                                      <p className="text-sm text-text-secondary">{method.description}</p>
                                    )}
                                    <p className="text-xs text-text-tertiary mt-1">
                                      Entrega en {method.estimated_days_min}
                                      {method.estimated_days_max !== method.estimated_days_min && `-${method.estimated_days_max}`} días
                                    </p>
                                  </div>
                                  <span className="font-bold whitespace-nowrap">{formatCurrency(methodCost)}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end mt-6">
                        <Button 
                          onClick={() => setStep('payment')}
                          disabled={!selectedAddressId || !selectedShippingMethodId}
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
                              {paymentConfig?.qr_code_url ? (
                                <img 
                                  src={paymentConfig.qr_code_url} 
                                  alt="Código QR para pago" 
                                  className="w-full h-auto object-contain"
                                />
                              ) : (
                                <div className="text-center p-4 text-black">
                                  <p className="font-bold">Código QR no disponible</p>
                                  <p className="text-sm">Contacte al administrador</p>
                                </div>
                              )}
                            </div>
                            
                            {paymentConfig?.instructions && (
                              <div className="bg-surface-light p-3 rounded-lg border border-border">
                                <p className="text-sm text-text-secondary whitespace-pre-wrap">{paymentConfig.instructions}</p>
                              </div>
                            )}
                            
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
                      <h3 className="font-bold mb-2 text-sm uppercase tracking-wider text-text-secondary">Método de Envío</h3>
                      {selectedShippingMethod && (
                        <p className="text-sm font-medium">
                          {selectedShippingMethod.name} - {formatCurrency(shippingCost)}
                        </p>
                      )}
                    </div>

                    <div className="bg-surface-light p-4 rounded-lg">
                      <h3 className="font-bold mb-2 text-sm uppercase tracking-wider text-text-secondary">Método de Pago</h3>
                      <p className="text-sm font-medium">
                        {paymentMethodLabel(paymentMethod)}
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
                            <span className="font-medium">{formatCurrency(Number(item.price_at_add) * item.quantity)}</span>
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
                    <span>{formatCurrency(orderSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-text-secondary">
                    <span>Envío</span>
                    <span>{formatCurrency(orderShipping)}</span>
                  </div>

                  {/* Coupon (or points, not both) */}
                  <div className="py-4 border-t border-border mt-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Tag className="w-4 h-4 text-primary" />
                      <span className="font-bold text-sm">¿Tiene un cupón?</span>
                    </div>
                    {appliedCoupon ? (
                      <div className="flex items-center justify-between gap-2 rounded-md border border-green-500/40 bg-green-500/10 px-3 py-2">
                        <span className="text-sm font-medium text-green-600 break-all">{appliedCoupon.code}</span>
                        <Button type="button" variant="ghost" size="sm" onClick={handleRemoveCoupon}>
                          Quitar
                        </Button>
                      </div>
                    ) : (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleApplyCoupon();
                        }}
                        className="flex items-start gap-2"
                      >
                        <div className="flex-1">
                          <Input
                            aria-label="Código del cupón"
                            placeholder="Código del cupón"
                            value={couponInput}
                            onChange={(e) => {
                              setCouponInput(e.target.value);
                              setCouponError(null);
                            }}
                            error={couponError ?? undefined}
                            disabled={redeemPoints > 0 || isApplyingCoupon}
                            maxLength={50}
                          />
                        </div>
                        <Button
                          type="submit"
                          variant="outline"
                          isLoading={isApplyingCoupon}
                          disabled={redeemPoints > 0 || !couponInput.trim()}
                        >
                          Aplicar
                        </Button>
                      </form>
                    )}
                    <p className="text-xs text-text-secondary mt-2">
                      {appliedCoupon
                        ? 'Con un cupón no se pueden canjear puntos. Quite el cupón para usar sus puntos.'
                        : redeemPoints > 0
                          ? 'Está canjeando puntos: ponga el canje en 0 para usar un cupón.'
                          : 'Puede usar un cupón o sus puntos, no ambos.'}
                    </p>
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
                          disabled={appliedCoupon !== null}
                          className="w-full accent-primary disabled:opacity-50"
                        />
                      </div>
                      <div className="flex justify-between text-xs mt-1">
                        <span>0</span>
                        <span className="font-bold text-primary">{redeemPoints} pts (-{formatCurrency(pointsValue)})</span>
                      </div>
                    </div>
                  )}

                  {appliedCoupon && (
                    <div className="flex justify-between text-green-600 font-medium">
                      <span>
                        {isShippingCoupon
                          ? `${couponDiscount >= orderShipping ? 'Envío gratis' : 'Descuento de envío'} (Cupón ${appliedCoupon.code})`
                          : `Descuento (Cupón ${appliedCoupon.code})`}
                      </span>
                      <span>-{formatCurrency(couponDiscount)}</span>
                    </div>
                  )}

                  {redeemPoints > 0 && (
                    <div className="flex justify-between text-green-600 font-medium">
                      <span>Descuento (Puntos)</span>
                      <span>-{formatCurrency(pointsValue)}</span>
                    </div>
                  )}

                  <div className="border-t border-border pt-2 flex justify-between font-bold text-lg text-primary">
                    <span>Total</span>
                    <span>{formatCurrency(orderTotal)}</span>
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
