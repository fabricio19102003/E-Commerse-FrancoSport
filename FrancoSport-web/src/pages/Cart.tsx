import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui';
import { Trash2, ShoppingBag, ArrowRight, Minus, Plus, ArrowLeft, ShieldCheck, Truck } from 'lucide-react';
import { useCartStore } from '@/store';
import { ROUTES } from '@/constants/routes';
import toast from 'react-hot-toast';
import { useConfirm } from '@/hooks/useConfirm';
import { logViewCart } from '@/api/analytics.service';

const Cart: React.FC = () => {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, clearCart, subtotal } = useCartStore();
  const { confirm } = useConfirm();
  const total = subtotal;

  useEffect(() => {
    if (items.length > 0) {
      logViewCart(items, total);
    }
  }, [items.length, total]); // Track when cart content changes or loads

  const handleUpdateQuantity = (id: number, newQuantity: number, stock: number) => {
    if (newQuantity < 1) return;
    if (newQuantity > stock) {
      toast.error('No hay suficiente stock disponible');
      return;
    }
    updateQuantity(id, newQuantity);
  };

  const handleRemoveItem = (id: number, name: string) => {
    removeItem(id);
    toast.success(`${name} eliminado del carrito`);
  };

  const handleClearCart = async () => {
    const isConfirmed = await confirm({
      title: 'Vaciar Carrito',
      message: '¿Estás seguro de que quieres eliminar todos los productos del carrito?',
      confirmText: 'Vaciar Carrito',
      variant: 'danger'
    });

    if (isConfirmed) {
      clearCart();
      toast.success('Carrito vaciado');
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-background py-12">
        <div className="w-24 h-24 bg-surface rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-500">
          <ShoppingBag className="w-10 h-10 text-text-tertiary" />
        </div>
        <h1 className="text-3xl font-bold mb-2 text-text-primary">Tu carrito está vacío</h1>
        <p className="text-text-secondary mb-8 text-center max-w-md">
          Parece que aún no has agregado productos. ¡Explora nuestra colección y encuentra lo que buscas!
        </p>
        <Link to={ROUTES.PRODUCTS}>
          <Button size="lg" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Volver a la tienda
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen py-12">
      <Container>
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ShoppingBag className="w-8 h-8 text-primary" />
            Tu Carrito
            <span className="text-lg font-normal text-text-secondary ml-2">
              ({items.length} {items.length === 1 ? 'producto' : 'productos'})
            </span>
          </h1>
          <Button 
            variant="ghost" 
            onClick={handleClearCart}
            className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
            leftIcon={<Trash2 className="w-4 h-4" />}
          >
            Vaciar Carrito
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div 
                key={item.id} 
                className="bg-surface rounded-xl p-4 border border-border hover:border-primary/30 transition-all duration-300 shadow-sm hover:shadow-md group"
              >
                <div className="flex gap-4 sm:gap-6">
                  {/* Image */}
                  <Link to={`/producto/${item.product?.slug}`} className="shrink-0">
                    <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-lg overflow-hidden border border-border">
                      <img 
                        src={item.product?.images[0]?.url || '/placeholder.png'} 
                        alt={item.product?.name} 
                        className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  </Link>

                  {/* Content */}
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <Link 
                          to={`/producto/${item.product?.slug}`}
                          className="font-bold text-lg text-text-primary hover:text-primary transition-colors line-clamp-2"
                        >
                          {item.product?.name}
                        </Link>
                        {item.product?.brand && (
                          <p className="text-sm text-text-tertiary mt-1">{item.product.brand.name}</p>
                        )}
                        {item.variant?.variant_name && (
                          <span className="inline-block mt-2 px-2 py-1 bg-surface-light rounded text-xs text-text-secondary border border-border">
                            {item.variant.variant_name}
                          </span>
                        )}
                      </div>
                      <button 
                        onClick={() => handleRemoveItem(item.id, item.product?.name || 'Producto')}
                        className="text-text-tertiary hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-500/10"
                        title="Eliminar"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mt-4">
                      {/* Quantity Control */}
                      <div className="flex items-center border border-border rounded-lg bg-background w-fit shadow-sm">
                        <button 
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1, item.product?.stock || 0)}
                          className="p-2 hover:text-primary transition-colors disabled:opacity-30"
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-10 text-center font-bold text-sm">{item.quantity}</span>
                        <button 
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1, item.product?.stock || 0)}
                          className="p-2 hover:text-primary transition-colors disabled:opacity-30"
                          disabled={item.quantity >= (item.product?.stock || 0)}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <p className="text-xs text-text-tertiary mb-1">
                          ${Number(item.price_at_add).toFixed(2)} x {item.quantity}
                        </p>
                        <p className="text-xl font-bold text-primary">
                          ${Number(item.subtotal).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-surface rounded-xl p-6 border border-border shadow-lg sticky top-24">
              <h2 className="text-xl font-bold mb-6 pb-4 border-b border-border">Resumen del Pedido</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-text-secondary">
                  <span>Subtotal</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>Envío</span>
                  <span className="text-green-500 font-medium">Gratis</span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>Impuestos estimados</span>
                  <span>$0.00</span>
                </div>
              </div>

              <div className="border-t border-border pt-4 mb-8">
                <div className="flex justify-between items-end">
                  <span className="font-bold text-lg">Total</span>
                  <span className="text-3xl font-black text-primary">${total.toFixed(2)}</span>
                </div>
              </div>

              <Button 
                fullWidth 
                size="lg" 
                onClick={() => navigate(ROUTES.CHECKOUT)}
                className="mb-4 shadow-primary/20 shadow-lg hover:shadow-primary/40 hover:translate-y-[-2px] transition-all"
                rightIcon={<ArrowRight className="w-5 h-5" />}
              >
                Proceder al Pago
              </Button>

              <Link to={ROUTES.PRODUCTS}>
                <Button variant="outline" fullWidth>
                  Continuar Comprando
                </Button>
              </Link>

              {/* Trust Badges */}
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="flex flex-col items-center text-center gap-2 p-3 bg-background rounded-lg border border-border/50">
                  <ShieldCheck className="w-6 h-6 text-primary" />
                  <span className="text-xs font-medium text-text-secondary">Pago Seguro</span>
                </div>
                <div className="flex flex-col items-center text-center gap-2 p-3 bg-background rounded-lg border border-border/50">
                  <Truck className="w-6 h-6 text-primary" />
                  <span className="text-xs font-medium text-text-secondary">Envío Rápido</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default Cart;
