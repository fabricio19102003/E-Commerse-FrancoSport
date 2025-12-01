import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from '@/components/layout/Container';
import { Loader2, ArrowRight } from 'lucide-react';
import { getCategories } from '@/api/products.service';
import type { Category } from '@/types';
import { ROUTES } from '@/constants/routes';

const Categories: React.FC = () => {
  const navigate = useNavigate();
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <div 
              key={category.id} 
              className="group cursor-pointer relative overflow-hidden rounded-2xl aspect-[3/4] border border-white/10 hover:border-primary/50 transition-all duration-500 shadow-2xl hover:shadow-primary/20"
              onClick={() => navigate(`${ROUTES.PRODUCTS}?category=${category.slug}`)}
            >
              {/* Image with Zoom Effect */}
              <div className="absolute inset-0 overflow-hidden">
                <img 
                  src={category.image_url || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=800'} 
                  alt={category.name}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 group-hover:rotate-1"
                />
              </div>

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500" />
              
              {/* Content */}
              <div className="absolute inset-0 flex flex-col justify-end p-6">
                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  <div className="h-1 w-12 bg-primary mb-4 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                  
                  <h3 className="text-3xl font-black uppercase italic text-white mb-2 leading-none tracking-tighter">
                    {category.name}
                  </h3>
                  
                  {category.description && (
                    <p className="text-sm text-neutral-300 mb-4 line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-75">
                      {category.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                    <span>Explorar Colección</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Shine Effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out pointer-events-none" />
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
};

export default Categories;
