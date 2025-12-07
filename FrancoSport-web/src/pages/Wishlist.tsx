import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui';
import { ShoppingCart, Trash2, Heart, ArrowRight } from 'lucide-react';
import { useWishlistStore, useCartStore } from '@/store';
import { formatCurrency } from '@/utils/currency';
import { ROUTES } from '@/constants/routes';
import toast from 'react-hot-toast';

const Wishlist: React.FC = () => {
  const { items, removeItem, fetchWishlist, isLoading } = useWishlistStore();
  const { addItem: addToCart } = useCartStore();

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const handleAddToCart = (product: any) => {
    addToCart(product, undefined, 1);
    toast.success('Producto agregado al carrito');
  };

  const handleRemove = (productId: number) => {
    removeItem(productId);
    toast.success('Producto eliminado de favoritos');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen py-8">
      <Container>
        <div className="flex items-center gap-3 mb-8">
          <Heart className="w-8 h-8 text-primary fill-current" />
          <h1 className="text-3xl font-bold text-text-primary">Mi Lista de Deseos</h1>
        </div>

        {items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((product) => (
              <div key={product.id} className="bg-surface rounded-lg border border-border overflow-hidden flex flex-col group hover:shadow-lg transition-all duration-300">
                <Link to={`/producto/${product.slug}`} className="aspect-square relative overflow-hidden bg-white">
                  <img 
                    src={product.images[0]?.url || '/placeholder.png'} 
                    alt={product.name}
                    className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                  />
                  {Number(product.stock) <= 0 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white font-bold px-3 py-1 border-2 border-white rounded transform -rotate-12">
                        AGOTADO
                      </span>
                    </div>
                  )}
                </Link>
                
                <div className="p-4 flex flex-col flex-grow">
                  <Link to={`/producto/${product.slug}`} className="mb-2">
                    <h3 className="font-bold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                  </Link>
                  
                  <div className="mt-auto">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xl font-bold text-primary">
                        {formatCurrency(Number(product.price))}
                      </span>
                      {product.compare_at_price && product.compare_at_price > product.price && (
                        <span className="text-sm text-text-tertiary line-through">
                          {formatCurrency(Number(product.compare_at_price))}
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handleAddToCart(product)}
                        className="flex-1"
                        disabled={Number(product.stock) <= 0}
                        leftIcon={<ShoppingCart className="w-4 h-4" />}
                      >
                        Agregar
                      </Button>
                      <button 
                        onClick={() => handleRemove(product.id)}
                        className="p-2 text-text-tertiary hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-surface rounded-xl border border-border">
            <Heart className="w-16 h-16 text-text-tertiary mx-auto mb-4 opacity-20" />
            <h2 className="text-xl font-bold text-text-primary mb-2">Tu lista de deseos está vacía</h2>
            <p className="text-text-secondary mb-6">Guarda los productos que te gustan para comprarlos después.</p>
            <Link to={ROUTES.PRODUCTS}>
              <Button rightIcon={<ArrowRight className="w-4 h-4" />}>
                Explorar Productos
              </Button>
            </Link>
          </div>
        )}
      </Container>
    </div>
  );
};

export default Wishlist;
