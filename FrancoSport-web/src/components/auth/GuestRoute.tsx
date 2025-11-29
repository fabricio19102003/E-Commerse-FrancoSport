/**
 * GuestRoute Component
 * Franco Sport E-Commerce
 * 
 * Protege rutas que solo deben ser accesibles para invitados
 * Ej: Login, Register - Si ya estás autenticado, redirige a home
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store';
import { ROUTES } from '@/constants/routes';

interface GuestRouteProps {
  children: React.ReactNode;
}

const GuestRoute: React.FC<GuestRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  // Si está autenticado, redirigir a home
  if (isAuthenticated) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return <>{children}</>;
};

export default GuestRoute;
