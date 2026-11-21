/**
 * AuthCard Component
 * Franco Sport E-Commerce
 *
 * Marco común de las páginas de recuperación de contraseña y verificación de correo
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui';
import { ROUTES } from '@/constants/routes';

interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

const AuthCard: React.FC<AuthCardProps> = ({ title, subtitle, children }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-surface to-background p-4 py-12">
      <Card className="w-full max-w-md" variant="elevated">
        <button
          onClick={() => navigate(ROUTES.HOME)}
          className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Volver al inicio</span>
        </button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gradient mb-2">{title}</h1>
          {subtitle && <p className="text-text-secondary">{subtitle}</p>}
        </div>

        {children}
      </Card>
    </div>
  );
};

export default AuthCard;
