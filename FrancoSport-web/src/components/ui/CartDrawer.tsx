/**
 * CartDrawer Component
 * Franco Sport E-Commerce
 * 
 * Drawer lateral que muestra el carrito de compras
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Badge } from '@/components/ui';
import { X, ShoppingCart, Minus, Plus, Trash2 } from 'lucide-react';
import { useCartStore, useUIStore } from '@/store';
import { ROUTES } from '@/constants/routes';
import toast from 'react-hot-toast';

const CartDrawer: React.FC = () => {
  const navigate = useNavigate();
  const { isCartDrawerOpen, closeCartDrawer } = useUIStore();
  const { items, itemsCount, subtotal, updateQuantity, removeItem } = useCartStore();

  // Cerrar drawer al presionar ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCartDrawer();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [closeCartDrawer]);

  // Bloquear scroll del body cuando está abierto
  useEffect(() => {
    if (isCartDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isCartDrawerOpen]);

  const handleCheckout = () => {
    closeCartDrawer();
    navigate(ROUTES.CHECKOUT);
  };

  const handleViewCart = () => {
    closeCartDrawer();
    navigate(ROUTES.CART);
  };

  const handleRemoveItem = (itemId: number, productName: string) => {
    removeItem(itemId);
    toast.success(`${productName} eliminado del carrito`);
  };

  if (!isCartDrawerOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
        onClick={closeCartDrawer}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-surface border-l border-surface-lighter z-50 animate-slide-in-right flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-surface-lighter">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-text-primary">
              Carrito de Compras
            </h2>
            {itemsCount > 0 && (
              <Badge variant="primary" size="sm">
                {itemsCount}
              </Badge>
            )}
          </div>
          <button
            onClick={closeCartDrawer}
            className="p-2 hover:bg-surface-light rounded-md transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Empty State */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-24 h-24 rounded-full bg-surface-light flex items-center justify-center mb-4">
              <ShoppingCart className="h-12 w-12 text-text-tertiary" />
            </div>
            <h3 className="text-xl font-bold text-text-primary mb-2">
              Tu carrito está vacío
            </h3>
            <p className="text-text-secondary mb-6">
              Agrega productos para empezar a comprar
            </p>
            <Button variant="primary" onClick={() => {
              closeCartDrawer();
              navigate(ROUTES.PRODUCTS);
            }}>
              Ver Productos
            </Button>
          </div>
        ) : (
          <>
            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 bg-surface-light p-3 rounded-lg border border-surface-lighter"
                >
                  {/* Image */}
                  <img
                    src={item.product?.images[0]?.url || 'https://via.placeholder.com/80'}
                    alt={item.product?.name}
                    className="w-20 h-20 object-cover rounded-md"
                  />

                  {/* Details */}
                  <div className="flex-1">
                    <h4 className="font-bold text-text-primary text-sm mb-1 line-clamp-1">
                      {item.product?.name}
                    </h4>
                    {item.variant && (
                      <p className="text-xs text-text-tertiary mb-2">
                        {item.variant.variant_name}
                      </p>
                    )}

                    {/* Price */}
                    <p className="text-primary font-bold mb-2">
                      ${Number(item.price_at_add).toFixed(2)}
                    </p>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 hover:bg-surface rounded transition-colors"
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center font-bold">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 hover:bg-surface rounded transition-colors"
                        disabled={item.quantity >= (item.variant?.stock || item.product?.stock || 0)}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleRemoveItem(item.id, item.product?.name || 'Producto')}
                        className="ml-auto p-1 hover:bg-red-500/10 hover:text-red-500 rounded transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t border-surface-lighter p-4 space-y-4">
              {/* Subtotal */}
              <div className="flex items-center justify-between text-lg">
                <span className="font-bold text-text-primary">Subtotal:</span>
                <span className="font-black text-primary text-2xl">
                  ${subtotal.toFixed(2)}
                </span>
              </div>

              {/* Note */}
              <p className="text-xs text-text-tertiary text-center">
                Envío e impuestos calculados en el checkout
              </p>

              {/* Actions */}
              <div className="space-y-2">
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={handleCheckout}
                  leftIcon={<ShoppingCart className="h-5 w-5" />}
                >
                  Proceder al Checkout
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  fullWidth
                  onClick={handleViewCart}
                >
                  Ver Carrito Completo
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default CartDrawer;
