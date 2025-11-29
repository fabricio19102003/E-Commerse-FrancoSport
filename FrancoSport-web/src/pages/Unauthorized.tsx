/**
 * Unauthorized (403) Page
 * Franco Sport E-Commerce
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@/components/ui';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { ROUTES } from '@/constants/routes';

const Unauthorized: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-surface to-background p-4">
      <Card className="w-full max-w-md text-center" variant="elevated">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center">
            <ShieldAlert className="h-12 w-12 text-red-500" />
          </div>
        </div>

        {/* Error Code */}
        <h1 className="text-6xl font-black text-primary mb-2">403</h1>

        {/* Title */}
        <h2 className="text-2xl font-bold text-text-primary mb-4">
          Acceso Denegado
        </h2>

        {/* Description */}
        <p className="text-text-secondary mb-8 leading-relaxed">
          No tienes permisos para acceder a esta página. Esta sección está
          restringida a administradores.
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

        {/* Additional Info */}
        <div className="mt-8 p-4 bg-surface-light rounded-lg border border-surface-lighter">
          <p className="text-xs text-text-tertiary">
            Si crees que esto es un error, por favor contacta al soporte técnico.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Unauthorized;
