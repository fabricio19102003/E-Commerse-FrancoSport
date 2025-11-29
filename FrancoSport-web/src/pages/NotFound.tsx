/**
 * Not Found (404) Page
 * Franco Sport E-Commerce
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@/components/ui';
import { SearchX, ArrowLeft, Home } from 'lucide-react';
import { ROUTES } from '@/constants/routes';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-surface to-background p-4">
      <Card className="w-full max-w-md text-center" variant="elevated">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
            <SearchX className="h-12 w-12 text-primary" />
          </div>
        </div>

        {/* Error Code */}
        <h1 className="text-6xl font-black text-primary mb-2">404</h1>

        {/* Title */}
        <h2 className="text-2xl font-bold text-text-primary mb-4">
          Página No Encontrada
        </h2>

        {/* Description */}
        <p className="text-text-secondary mb-8 leading-relaxed">
          Lo sentimos, la página que buscas no existe o ha sido movida. Verifica
          la URL o regresa al inicio.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="ghost"
            size="lg"
            onClick={() => navigate(-1)}
            leftIcon={<ArrowLeft className="h-5 w-5" />}
            fullWidth
          >
            Volver Atrás
          </Button>

          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate(ROUTES.HOME)}
            leftIcon={<Home className="h-5 w-5" />}
            fullWidth
          >
            Ir al Inicio
          </Button>
        </div>

        {/* Popular Links */}
        <div className="mt-8 p-4 bg-surface-light rounded-lg border border-surface-lighter text-left">
          <p className="text-xs text-text-tertiary font-bold uppercase mb-3">
            Enlaces Populares:
          </p>
          <div className="space-y-2">
            <button
              onClick={() => navigate(ROUTES.PRODUCTS)}
              className="block w-full text-left text-sm text-primary hover:underline"
            >
              → Ver Productos
            </button>
            <button
              onClick={() => navigate(ROUTES.CATEGORIES)}
              className="block w-full text-left text-sm text-primary hover:underline"
            >
              → Explorar Categorías
            </button>
            <button
              onClick={() => navigate(ROUTES.CART)}
              className="block w-full text-left text-sm text-primary hover:underline"
            >
              → Ver Carrito
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default NotFound;
