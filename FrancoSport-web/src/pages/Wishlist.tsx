import React from 'react';
import { formatCurrency } from '@/utils/currency';
import { Link } from 'react-router-dom';
import { Container } from '@/components/layout/Container';
import { Button, Card } from '@/components/ui';
import { Heart, ShoppingCart, Trash2, ArrowRight } from 'lucide-react';
import { useWishlistStore, useCartStore } from '@/store';
import { ROUTES, generateRoute } from '@/constants/routes';
import toast from 'react-hot-toast';
import { useConfirm } from '@/hooks/useConfirm';

const Wishlist: React.FC = () => {
  const { items, removeItem, clearWishlist } = useWishlistStore();
  const { addItem: addToCart } = useCartStore();
  const { confirm } = useConfirm();

  const handleAddToCart = (product: any) => {
    addToCart(product);
    toast.success('Producto agregado al carrito');
  };

  const handleRemove = (id: number, name: string) => {
    removeItem(id);
    toast.success(`${name} eliminado de favoritos`);
  };

  const handleClear = async () => {
    const isConfirmed = await confirm({
      title: 'Vaciar Favoritos',
      message: '¿Estás seguro de que quieres eliminar todos los productos de tu lista de favoritos?',
      confirmText: 'Vaciar Favoritos',
      variant: 'danger'
    });

    if (isConfirmed) {
      clearWishlist();
      toast.success('Lista de favoritos vaciada');
    }
  };

  return (
    <div className="py-12 bg-background min-h-[70vh]">
      <Container>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Mis Favoritos</h1>
            <p className="text-text-secondary">
              {items.length} {items.length === 1 ? 'producto guardado' : 'productos guardados'}
            </p>
          </div>
          {items.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleClear} leftIcon={<Trash2 className="w-4 h-4" />}>
              Vaciar Lista
            </Button>
          )}
        </div>

        {items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((product) => (
              <Card key={product.id} className="flex flex-col h-full group overflow-hidden">
                <div className="relative aspect-square overflow-hidden bg-surface-light">
                  <Link to={generateRoute.productDetail(product.slug)}>
                    <img
                      src={product.images[0]?.url || '/placeholder.png'}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </Link>
                  <button
                    onClick={() => handleRemove(product.id, product.name)}
                    className="absolute top-2 right-2 p-2 bg-surface/80 backdrop-blur-sm rounded-full text-red-500 hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {product.stock <= 0 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center pointer-events-none">
                      <span className="text-white font-bold px-3 py-1 border-2 border-white rounded-md transform -rotate-12">
                        AGOTADO
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-4 flex-1 flex flex-col">
                  <Link to={generateRoute.productDetail(product.slug)} className="block mb-2">
                    <h3 className="font-bold text-lg leading-tight hover:text-primary transition-colors line-clamp-2">
                      {product.name}
                    </h3>
                  </Link>

                  <div className="mt-auto pt-4 border-t border-border flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                      <span className="text-xl font-bold text-primary">
                        {formatCurrency(Number(product.price))}
                      </span>
                      {product.compare_at_price && product.compare_at_price > product.price && (
                        <span className="text-xs text-text-tertiary line-through">
                          {formatCurrency(Number(product.compare_at_price))}
                        </span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      disabled={product.stock <= 0}
                      onClick={() => handleAddToCart(product)}
                      className="shrink-0"
                    >
                      <ShoppingCart className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-surface rounded-xl border border-border border-dashed">
            <Heart className="w-16 h-16 text-text-tertiary mx-auto mb-4 opacity-20" />
            <h3 className="text-xl font-bold text-text-primary mb-2">Tu lista de favoritos está vacía</h3>
            <p className="text-text-secondary mb-8 max-w-md mx-auto">
              Guarda los productos que más te gusten para comprarlos después.
            </p>
            <Link to={ROUTES.PRODUCTS}>
              <Button variant="primary" leftIcon={<ArrowRight className="w-4 h-4" />}>
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
