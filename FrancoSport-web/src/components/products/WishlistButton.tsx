import React from 'react';
import { Heart } from 'lucide-react';
import { useWishlistStore } from '@/store/wishlistStore';
import type { Product } from '@/types';
import { cn } from '@/utils/cn';
import { toast } from 'react-hot-toast';

interface WishlistButtonProps {
    product: Product;
    className?: string;
    iconSize?: number;
}

const WishlistButton: React.FC<WishlistButtonProps> = ({ 
    product, 
    className,
    iconSize = 20
}) => {
    const { isInWishlist, addItem, removeItem } = useWishlistStore();
    const isIn = isInWishlist(product.id);

    const handleToggle = (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent navigating to product details if inside a link
        e.stopPropagation();

        if (isIn) {
            removeItem(product.id);
            toast.success('Eliminado de favoritos');
        } else {
            addItem(product);
            toast.success('Agregado a favoritos');
        }
    };

    return (
        <button
            onClick={handleToggle}
            className={cn(
                "p-2 rounded-full transition-all duration-200 hover:scale-110 active:scale-95",
                isIn 
                    ? "bg-red-500/10 text-red-500 hover:bg-red-500/20" 
                    : "bg-black/20 text-white hover:bg-white hover:text-black backdrop-blur-sm",
                className
            )}
            aria-label={isIn ? "Eliminar de favoritos" : "Agregar a favoritos"}
        >
            <Heart 
                size={iconSize} 
                className={cn(
                    "transition-colors",
                    isIn && "fill-current"
                )} 
            />
        </button>
    );
};

export default WishlistButton;
