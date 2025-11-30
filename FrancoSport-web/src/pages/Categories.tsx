import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Container } from '@/components/layout/Container';
import { Card } from '@/components/ui';
import { Loader2, ShoppingBag } from 'lucide-react';
import { getCategories } from '@/api/products.service';
import type { Category } from '@/types';
import { ROUTES } from '@/constants/routes';

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="py-12 bg-background">
      <Container>
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold mb-4">Nuestras Categorías</h1>
          <p className="text-text-secondary max-w-2xl mx-auto">
            Explora nuestra amplia selección de productos organizados por categorías.
            Encuentra exactamente lo que necesitas para tu deporte favorito.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <Link 
              key={category.id} 
              to={`${ROUTES.PRODUCTS}?category=${category.id}`}
              className="group"
            >
              <Card hoverable className="h-full overflow-hidden flex flex-col">
                <div className="aspect-[4/3] relative overflow-hidden bg-surface-light">
                  {category.image_url ? (
                    <img
                      src={category.image_url}
                      alt={category.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-text-tertiary">
                      <ShoppingBag className="w-12 h-12 opacity-20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <p className="text-sm font-medium opacity-90">{category.products_count || 0} productos</p>
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col items-center justify-center text-center">
                  <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                    {category.name}
                  </h3>
                  {category.description && (
                    <p className="text-sm text-text-secondary line-clamp-2">
                      {category.description}
                    </p>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </Container>
    </div>
  );
};

export default Categories;
