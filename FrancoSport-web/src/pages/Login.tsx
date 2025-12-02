import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui';
import { Mail, Lock, ArrowLeft } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store';
import toast from 'react-hot-toast';
import { WavyBackground } from '@/components/ui/wavy-background';
import { logLogin } from '@/api/analytics.service';

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

      logLogin('email');
      toast.success('¡Bienvenido de nuevo!');
      
      // Redirect to the page they tried to access, or home
      navigate(from, { replace: true });
    } catch (err) {
      // El error ya está en el store, pero mostramos toast
      toast.error(error || 'Error al iniciar sesión');
    }
  };

  return (
    <WavyBackground className="max-w-4xl mx-auto pb-40">
      <div className="relative w-full max-w-md mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => navigate(ROUTES.HOME)}
          className="absolute -top-16 left-0 flex items-center gap-2 text-white/80 hover:text-white transition-colors z-50"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Volver al inicio</span>
        </button>

        {/* 3D Card Effect Container */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-violet-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative bg-white/10 dark:bg-black/40 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-8 transform transition-all hover:scale-[1.01] duration-300">
            
            {/* Logo & Header */}
            <div className="text-center mb-8">
              <div className="mx-auto w-24 h-24 mb-4 relative group/logo cursor-pointer">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
                <img 
                  src="/assets/logo-login.jpg" 
                  alt="FrancoSport Logo" 
                  className="relative w-full h-full object-cover rounded-full border-2 border-white/50 shadow-lg transform group-hover/logo:rotate-12 transition-transform duration-500"
                />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2 tracking-tight drop-shadow-lg">
                Bienvenido de nuevo
              </h2>
              <p className="text-gray-200">
                Ingresa a tu cuenta para continuar
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1 ml-1">
                  Correo Electrónico
                </label>
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400 group-focus-within/input:text-white transition-colors" />
                  </div>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl bg-black/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm backdrop-blur-sm"
                    placeholder="tu@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1 ml-1">
                  Contraseña
                </label>
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 group-focus-within/input:text-white transition-colors" />
                  </div>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl bg-black/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm backdrop-blur-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center text-gray-300 cursor-pointer hover:text-white transition-colors">
                  <input 
                    type="checkbox" 
                    checked={formData.remember_me}
                    onChange={(e) => setFormData({ ...formData, remember_me: e.target.checked })}
                    className="rounded border-gray-500 bg-black/20 text-primary focus:ring-primary mr-2" 
                  />
                  Recordarme
                </label>
                <Link
                  to={ROUTES.FORGOT_PASSWORD}
                  className="font-medium text-primary-300 hover:text-primary-200 transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              <Button
                type="submit"
                isLoading={isLoading}
                fullWidth
                size="lg"
                className="bg-gradient-to-r from-primary to-red-600 hover:from-primary-dark hover:to-red-700 text-white shadow-lg shadow-primary/30 transform hover:-translate-y-0.5 transition-all duration-200 rounded-xl font-bold text-lg border-none"
              >
                Iniciar Sesión
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-300">
                ¿No tienes una cuenta?{' '}
                <Link
                  to={ROUTES.REGISTER}
                  className="font-bold text-white hover:text-primary-300 transition-colors hover:underline"
                >
                  Regístrate aquí
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </WavyBackground>
  );
};

export default Login;
