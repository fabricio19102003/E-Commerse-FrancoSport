import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button, Input, Card } from '@/components/ui';
import { Mail, Lock, ArrowLeft } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store';
import toast from 'react-hot-toast';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error } = useAuthStore();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember_me: false,
  });

  // Get the page they tried to access (for redirect after login)
  const from = (location.state as any)?.from?.pathname || ROUTES.HOME;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones básicas
    if (!formData.email || !formData.password) {
      toast.error('Todos los campos son obligatorios');
      return;
    }

    try {
      await login({
        email: formData.email,
        password: formData.password,
        remember_me: formData.remember_me,
      });

      toast.success('¡Bienvenido de nuevo!');
      
      // Redirect to the page they tried to access, or home
      navigate(from, { replace: true });
    } catch (err) {
      // El error ya está en el store, pero mostramos toast
      toast.error(error || 'Error al iniciar sesión');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-surface to-background p-4">
      <Card className="w-full max-w-md" variant="elevated">
        {/* Back Button */}
        <button
          onClick={() => navigate(ROUTES.HOME)}
          className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Volver al inicio</span>
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gradient mb-2">Iniciar Sesión</h1>
          <p className="text-text-secondary">Bienvenido de vuelta a Franco Sport</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="tu@email.com"
            leftIcon={<Mail className="h-5 w-5" />}
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            fullWidth
          />

          <Input
            label="Contraseña"
            type="password"
            placeholder="••••••••"
            leftIcon={<Lock className="h-5 w-5" />}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            fullWidth
          />

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.remember_me}
                onChange={(e) =>
                  setFormData({ ...formData, remember_me: e.target.checked })
                }
                className="w-4 h-4 rounded border-surface-lighter bg-surface text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
              />
              <span className="text-sm text-text-secondary">Recordarme</span>
            </label>

            <Link
              to={ROUTES.FORGOT_PASSWORD}
              className="text-sm text-primary hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isLoading}
          >
            Ingresar
          </Button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-surface-lighter" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-surface text-text-tertiary">¿No tienes cuenta?</span>
          </div>
        </div>

        {/* Register Link */}
        <Button
          variant="outline"
          size="lg"
          fullWidth
          onClick={() => navigate(ROUTES.REGISTER)}
        >
          Crear cuenta nueva
        </Button>

        {/* Demo Credentials */}
        <div className="mt-6 p-4 bg-surface-light rounded-lg border border-surface-lighter">
          <p className="text-xs text-text-tertiary mb-2 font-bold uppercase">
            Credenciales de Prueba:
          </p>
          <div className="space-y-1 text-xs text-text-secondary">
            <p>👤 Admin: admin@franco.com / 1234</p>
            <p>👤 Usuario: user@franco.com / 1234</p>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-xs text-text-tertiary text-center mt-6">
          Al iniciar sesión, aceptas nuestros{' '}
          <Link to="/terminos" className="text-primary hover:underline">
            Términos y Condiciones
          </Link>{' '}
          y{' '}
          <Link to="/privacidad" className="text-primary hover:underline">
            Política de Privacidad
          </Link>
        </p>
      </Card>
    </div>
  );
};

export default Login;
