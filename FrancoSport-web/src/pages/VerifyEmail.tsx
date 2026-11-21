import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthCard } from '@/components/auth';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store';
import * as authService from '@/api/auth.service';
import { getErrorMessage } from '@/api/axios';

type Status = 'loading' | 'success' | 'error';

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { isAuthenticated, updateUser } = useAuthStore();

  const [status, setStatus] = useState<Status>(token ? 'loading' : 'error');
  const [isSending, setIsSending] = useState(false);
  // El token es de un solo uso: no debe enviarse dos veces (p. ej. por StrictMode)
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;

    authService
      .verifyEmail(token)
      .then(() => {
        updateUser({ email_verified: true });
        setStatus('success');
      })
      .catch(() => setStatus('error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleResend = async () => {
    setIsSending(true);
    try {
      toast.success(await authService.resendVerification());
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AuthCard title="Verificación de correo">
      {status === 'loading' && (
        <div className="flex flex-col items-center gap-4 text-text-secondary">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p>Verificando su correo...</p>
        </div>
      )}

      {status === 'success' && (
        <div className="space-y-6 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
          <p className="text-text-secondary">¡Su correo fue verificado! Ya puede realizar pedidos.</p>
          <Link to={ROUTES.HOME} className="font-semibold text-primary hover:underline">
            Ir a la tienda
          </Link>
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-6 text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto" />
          <p className="text-text-secondary">
            El enlace de verificación no es válido o ha expirado.
          </p>
          {isAuthenticated ? (
            <Button onClick={handleResend} isLoading={isSending} fullWidth size="lg">
              Reenviar correo
            </Button>
          ) : (
            <p className="text-text-secondary">
              <Link to={ROUTES.LOGIN} className="font-semibold text-primary hover:underline">
                Inicie sesión
              </Link>{' '}
              para solicitar un nuevo correo de verificación.
            </p>
          )}
        </div>
      )}
    </AuthCard>
  );
};

export default VerifyEmail;
