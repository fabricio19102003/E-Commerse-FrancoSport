import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Input } from '@/components/ui';
import { Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthCard } from '@/components/auth';
import { ROUTES } from '@/constants/routes';
import * as authService from '@/api/auth.service';
import { getErrorMessage } from '@/api/axios';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({ password: '', confirm_password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [expired, setExpired] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.password || !formData.confirm_password) {
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

    setIsLoading(true);
    try {
      await authService.resetPassword(token!, formData.password);
      toast.success('Contraseña actualizada. Inicie sesión con su nueva contraseña.');
      navigate(ROUTES.LOGIN, { replace: true });
    } catch (error) {
      // Un 400 con INVALID_TOKEN significa enlace usado, vencido o inválido
      if ((error as { response?: { data?: { error?: { code?: string } } } }).response?.data?.error?.code === 'INVALID_TOKEN') {
        setExpired(true);
      } else {
        toast.error(getErrorMessage(error));
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!token || expired) {
    return (
      <AuthCard title="Enlace no válido">
        <div className="space-y-6 text-center">
          <p className="text-text-secondary">
            El enlace para restablecer la contraseña no es válido o ha expirado. Solicite uno nuevo.
          </p>
          <Link to={ROUTES.FORGOT_PASSWORD} className="font-semibold text-primary hover:underline">
            Solicitar un nuevo enlace
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Nueva contraseña" subtitle="Elija una contraseña nueva para su cuenta">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          type="password"
          label="Nueva contraseña"
          placeholder="••••••••"
          helperText="Mínimo 8 caracteres"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          leftIcon={<Lock className="h-5 w-5" />}
          fullWidth
        />
        <Input
          type="password"
          label="Confirmar contraseña"
          placeholder="••••••••"
          value={formData.confirm_password}
          onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
          leftIcon={<Lock className="h-5 w-5" />}
          fullWidth
        />
        <Button type="submit" isLoading={isLoading} fullWidth size="lg">
          Cambiar contraseña
        </Button>
      </form>
    </AuthCard>
  );
};

export default ResetPassword;
