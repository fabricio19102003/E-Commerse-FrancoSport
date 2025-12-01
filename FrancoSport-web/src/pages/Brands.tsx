import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from '@/components/layout/Container';
import { Loader2, ArrowRight } from 'lucide-react';
import { getBrands } from '@/api/products.service';
import type { Brand } from '@/types';
import { ROUTES } from '@/constants/routes';

const Brands: React.FC = () => {
  const navigate = useNavigate();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const data = await getBrands();
        setBrands(data.filter(b => b.is_active));
      } catch (error) {
        console.error('Error fetching brands:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBrands();
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
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-black italic uppercase mb-4">
            Nuestras <span className="text-primary">Marcas</span>
          </h1>
          <p className="text-text-secondary max-w-2xl mx-auto text-lg">
            Trabajamos con las mejores marcas deportivas del mundo. 
            Calidad, rendimiento y estilo en cada producto.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {brands.map((brand) => (
            <div 
              key={brand.id} 
              className="group cursor-pointer relative overflow-hidden rounded-2xl aspect-[4/3] border border-white/10 hover:border-primary/50 transition-all duration-500 shadow-2xl hover:shadow-primary/20 bg-surface"
              onClick={() => navigate(`${ROUTES.PRODUCTS}?brand=${brand.slug}`)}
            >
              {/* Background Pattern/Gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-surface via-surface to-black opacity-50" />
              
              {/* Logo Container */}
              <div className="absolute inset-0 flex items-center justify-center p-6 z-10">
                <div className="relative w-full h-full flex items-center justify-center transform group-hover:scale-105 transition-transform duration-500">
                  {brand.logo_url ? (
                    <img 
                      src={brand.logo_url} 
                      alt={brand.name}
                      className="w-full h-full object-contain filter drop-shadow-lg group-hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all duration-500"
                    />
                  ) : (
                    <span className="text-4xl font-black text-white/20 uppercase">{brand.name}</span>
                  )}
                </div>
              </div>

              {/* Overlay Content */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6 z-20 backdrop-blur-sm">
                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  <h3 className="text-2xl font-bold text-white mb-1">{brand.name}</h3>
                  <p className="text-primary font-medium text-sm mb-4">
                    {brand.products_count || 0} Productos Disponibles
                  </p>
                  
                  <div className="flex items-center gap-2 text-white text-sm font-bold uppercase tracking-wider">
                    <span>Ver Productos</span>
                    <ArrowRight className="w-4 h-4 text-primary" />
                  </div>
                </div>
              </div>

              {/* Shine Effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out pointer-events-none z-30" />
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
};

export default Brands;
