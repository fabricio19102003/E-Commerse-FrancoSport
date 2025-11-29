import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input, Card } from '@/components/ui';
import { Mail, Lock, User as UserIcon, ArrowLeft } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store';
import toast from 'react-hot-toast';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading, error } = useAuthStore();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirm_password: '',
    accept_terms: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (
      !formData.first_name ||
      !formData.last_name ||
      !formData.email ||
      !formData.password ||
      !formData.confirm_password
    ) {
      toast.error('Todos los campos son obligatorios');
      return;
    }

    if (formData.password !== formData.confirm_password) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (!formData.accept_terms) {
      toast.error('Debes aceptar los términos y condiciones');
      return;
    }

    try {
      await register({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        password: formData.password,
      });

      toast.success('¡Cuenta creada exitosamente!');
      navigate(ROUTES.HOME);
    } catch (err) {
      toast.error(error || 'Error al crear la cuenta');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-surface to-background p-4 py-12">
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
          <h1 className="text-3xl font-bold text-gradient mb-2">Crear Cuenta</h1>
          <p className="text-text-secondary">
            Únete a Franco Sport y empieza a comprar
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nombre"
              type="text"
              placeholder="Juan"
              leftIcon={<UserIcon className="h-5 w-5" />}
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              required
            />

            <Input
              label="Apellido"
              type="text"
              placeholder="Pérez"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              required
            />
          </div>

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
            helperText="Mínimo 8 caracteres, incluye mayúsculas, minúsculas y números"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            fullWidth
          />

          <Input
            label="Confirmar Contraseña"
            type="password"
            placeholder="••••••••"
            leftIcon={<Lock className="h-5 w-5" />}
            value={formData.confirm_password}
            onChange={(e) =>
              setFormData({ ...formData, confirm_password: e.target.value })
            }
            required
            fullWidth
          />

          {/* Terms Checkbox */}
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.accept_terms}
              onChange={(e) =>
                setFormData({ ...formData, accept_terms: e.target.checked })
              }
              className="mt-1 w-4 h-4 rounded border-surface-lighter bg-surface text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
            />
            <span className="text-sm text-text-secondary">
              Acepto los{' '}
              <Link to="/terminos" className="text-primary hover:underline">
                Términos y Condiciones
              </Link>{' '}
              y la{' '}
              <Link to="/privacidad" className="text-primary hover:underline">
                Política de Privacidad
              </Link>
            </span>
          </label>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isLoading}
          >
            Crear Cuenta
          </Button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-surface-lighter" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-surface text-text-tertiary">¿Ya tienes cuenta?</span>
          </div>
        </div>

        {/* Login Link */}
        <Button
          variant="outline"
          size="lg"
          fullWidth
          onClick={() => navigate(ROUTES.LOGIN)}
        >
          Iniciar Sesión
        </Button>
      </Card>
    </div>
  );
};

export default Register;
