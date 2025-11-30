import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Container } from '@/components/layout/Container';
import { Card } from '@/components/ui';
import { Loader2, Tag } from 'lucide-react';
import { getBrands } from '@/api/products.service';
import type { Brand } from '@/types';
import { ROUTES } from '@/constants/routes';

const Brands: React.FC = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const data = await getBrands();
        setBrands(data);
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
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold mb-4">Nuestras Marcas</h1>
          <p className="text-text-secondary max-w-2xl mx-auto">
            Trabajamos con las mejores marcas deportivas del mercado para garantizar
            calidad y rendimiento en cada producto.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {brands.map((brand) => (
            <Link 
              key={brand.id} 
              to={`${ROUTES.PRODUCTS}?brand=${brand.id}`}
              className="group"
            >
              <Card hoverable className="h-full overflow-hidden flex flex-col items-center justify-center p-6 transition-all duration-300 group-hover:border-primary/50">
                <div className="w-24 h-24 mb-4 relative flex items-center justify-center grayscale group-hover:grayscale-0 transition-all duration-300">
                  {brand.logo_url ? (
                    <img
                      src={brand.logo_url}
                      alt={brand.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <Tag className="w-12 h-12 text-text-tertiary opacity-30" />
                  )}
                </div>
                <h3 className="text-lg font-bold text-center group-hover:text-primary transition-colors">
                  {brand.name}
                </h3>
                <p className="text-xs text-text-tertiary mt-2">
                  {brand.products_count || 0} productos
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </Container>
    </div>
  );
};

export default Brands;
