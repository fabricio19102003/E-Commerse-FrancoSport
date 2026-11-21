import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input } from '@/components/ui';
import { Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthCard } from '@/components/auth';
import { ROUTES } from '@/constants/routes';
import * as authService from '@/api/auth.service';
import { getErrorMessage } from '@/api/axios';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('Ingrese su correo electrónico');
      return;
    }

    setIsLoading(true);
    try {
      await authService.forgotPassword(email);
      setSent(true);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard
      title="Recuperar contraseña"
      subtitle="Le enviaremos un enlace para crear una nueva contraseña"
    >
      {sent ? (
        <div className="space-y-6 text-center">
          <p className="text-text-secondary">
            Si el correo está registrado, recibirá instrucciones para restablecer su contraseña. El enlace
            vence en 60 minutos.
          </p>
          <Link to={ROUTES.LOGIN} className="font-semibold text-primary hover:underline">
            Volver a iniciar sesión
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            type="email"
            label="Correo electrónico"
            placeholder="su@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="h-5 w-5" />}
            fullWidth
          />
          <Button type="submit" isLoading={isLoading} fullWidth size="lg">
            Enviar enlace
          </Button>
          <p className="text-center text-text-secondary">
            <Link to={ROUTES.LOGIN} className="font-semibold text-primary hover:underline">
              Volver a iniciar sesión
            </Link>
          </p>
        </form>
      )}
    </AuthCard>
  );
};

export default ForgotPassword;
