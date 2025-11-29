/**
 * ProductCard Component
 * Franco Sport E-Commerce
 *
 * Card de producto para mostrar en grids/listas
 */

import React from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui";
import { ShoppingCart, Heart, Star } from "lucide-react";
import type { Product } from "@/types";
import { useCartStore } from "@/store";
import toast from "react-hot-toast";

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addItem } = useCartStore();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Evitar navegación del Link
    e.stopPropagation();

    addItem(product, undefined, 1);
    toast.success(`${product.name} agregado al carrito`);
  };

  const handleAddToWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // TODO: Implementar wishlist
    toast.success("Agregado a favoritos");
  };

  // Calcular descuento
  const hasDiscount =
    product.compare_at_price && product.compare_at_price > product.price;
  const discountPercentage = hasDiscount
    ? Math.round(
        ((product.compare_at_price! - product.price) /
          product.compare_at_price!) *
          100
      )
    : 0;

  return (
    <Link
      to={`/producto/${product.slug}`}
      className="group block bg-surface rounded-lg overflow-hidden border border-surface-lighter hover:border-primary/50 transition-all duration-300 hover:shadow-glow"
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-surface-light">
        <img
          src={product.images[0]?.url || "https://via.placeholder.com/400"}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />

        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
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

        {/* Action Buttons */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={handleAddToWishlist}
            className="p-2 bg-surface/90 backdrop-blur-sm rounded-full hover:bg-primary hover:text-white transition-colors shadow-md"
            title="Agregar a favoritos"
          >
            <Heart className="h-5 w-5" />
          </button>
        </div>

        {/* Quick Add to Cart (Mobile & Desktop) */}
        {product.stock > 0 && (
          <button
            onClick={handleAddToCart}
            className="absolute bottom-3 left-3 right-3 bg-primary hover:bg-primary-700 text-white py-2 px-4 rounded-md font-bold uppercase text-sm flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 shadow-lg"
          >
            <ShoppingCart className="h-4 w-4" />
            Agregar al Carrito
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
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
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black text-primary">
            ${product.price.toFixed(2)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-text-tertiary line-through">
              ${product.compare_at_price!.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
