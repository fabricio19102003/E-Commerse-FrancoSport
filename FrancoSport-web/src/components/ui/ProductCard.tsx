/**
 * ProductCard Component
 * Franco Sport E-Commerce
 *
 * Card de producto para mostrar en grids/listas
 */

import React from "react";
import { formatCurrency } from "@/utils/currency";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui";
import { ShoppingCart, Heart, Star, Eye } from "lucide-react";
import type { Product } from "@/types";
import { useCartStore, useWishlistStore } from "@/store";
import toast from "react-hot-toast";

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addItem } = useCartStore();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore();
  const isInWishlistState = isInWishlist(product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Evitar navegación del Link
    e.stopPropagation();

    addItem(product, undefined, 1);
    toast.success(`${product.name} agregado al carrito`);
  };

  const handleAddToWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isInWishlistState) {
      removeFromWishlist(product.id);
      toast.success("Eliminado de favoritos");
    } else {
      addToWishlist(product);
      toast.success("Agregado a favoritos");
    }
  };

  // Calcular descuento
  const hasDiscount =
    product.compare_at_price && product.compare_at_price > product.price;
  const discountPercentage = hasDiscount
    ? Math.round(
        ((Number(product.compare_at_price!) - Number(product.price)) /
          Number(product.compare_at_price!)) *
          100
      )
    : 0;

  return (
    <div className="group flex flex-col h-full bg-surface rounded-lg overflow-hidden border border-surface-lighter hover:border-primary/50 transition-all duration-300 hover:shadow-glow relative">
      <Link to={`/producto/${product.slug}`} className="block relative aspect-square overflow-hidden bg-surface-light">
        <img
          src={product.images[0]?.url || "https://via.placeholder.com/400"}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />

        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
          {hasDiscount && (
            <Badge variant="danger" className="shadow-md">
              -{discountPercentage}%
            </Badge>
          )}
          {product.is_featured && (
            <Badge variant="warning" className="shadow-md">
              Destacado
            </Badge>
          )}
          {product.stock === 0 && (
            <Badge variant="default" className="shadow-md">
              Agotado
            </Badge>
          )}
          {product.stock > 0 &&
            product.stock <= product.low_stock_threshold && (
              <Badge variant="warning" className="shadow-md">
                ¡Últimas unidades!
              </Badge>
            )}
        </div>

        {/* Wishlist Button */}
        <div className="absolute top-3 right-3 z-20">
          <button
            onClick={handleAddToWishlist}
            className={`p-2 backdrop-blur-sm rounded-full transition-colors shadow-md opacity-0 group-hover:opacity-100 ${
              isInWishlistState 
                ? "bg-primary text-white opacity-100" 
                : "bg-surface/90 hover:bg-primary hover:text-white"
            }`}
            title={isInWishlistState ? "Eliminar de favoritos" : "Agregar a favoritos"}
          >
            <Heart className={`h-5 w-5 ${isInWishlistState ? "fill-current" : ""}`} />
          </button>
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-col flex-grow p-4">
        <Link to={`/producto/${product.slug}`} className="block flex-grow">
          {/* Title */}
          <h3 className="font-bold text-text-primary mb-1 line-clamp-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>

          {/* Short Description */}
          {product.short_description && (
            <p className="text-sm text-text-tertiary mb-3 line-clamp-1">
              {product.short_description}
            </p>
          )}

          {/* Rating */}
          {product.avg_rating &&
            product.reviews_count &&
            product.reviews_count > 0 && (
              <div className="flex items-center gap-1 mb-3">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(product.avg_rating!)
                          ? "fill-yellow-500 text-yellow-500"
                          : "text-surface-lighter"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-text-tertiary">
                  ({product.reviews_count})
                </span>
              </div>
            )}

          {/* Price */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl font-black text-primary">
              {formatCurrency(Number(product.price))}
            </span>
            {hasDiscount && (
              <span className="text-sm text-text-tertiary line-through">
                {formatCurrency(Number(product.compare_at_price!))}
              </span>
            )}
          </div>
        </Link>

        {/* Add to Cart Button - Always at bottom */}
        <div className="mt-auto pt-2">
          {product.stock > 0 ? (
             product.variants && product.variants.length > 0 ? (
              <Link
                to={`/producto/${product.slug}`}
                className="w-full bg-primary hover:bg-primary-700 text-white py-2 px-4 rounded-md font-bold uppercase text-sm flex items-center justify-center gap-2 transition-all duration-300 shadow-lg"
              >
                <Eye className="h-4 w-4" />
                Ver Opciones
              </Link>
            ) : (
              <button
                onClick={handleAddToCart}
                className="w-full bg-primary hover:bg-primary-700 text-white py-2 px-4 rounded-md font-bold uppercase text-sm flex items-center justify-center gap-2 transition-all duration-300 shadow-lg"
              >
                <ShoppingCart className="h-4 w-4" />
                Agregar al Carrito
              </button>
            )
          ) : (
            <button
              disabled
              className="w-full bg-gray-600 text-gray-400 py-2 px-4 rounded-md font-bold uppercase text-sm flex items-center justify-center gap-2 cursor-not-allowed"
            >
              Agotado
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
