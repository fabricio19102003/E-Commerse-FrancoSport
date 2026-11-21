/**
 * EmailVerificationNotice Component
 * Franco Sport E-Commerce
 *
 * Aviso global para clientes con sesión iniciada y correo sin verificar.
 * Se muestra en el layout principal, así también aparece en el checkout.
 */

import React, { useEffect, useState } from 'react';
import { MailWarning } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store';
import * as authService from '@/api/auth.service';
import { getErrorMessage } from '@/api/axios';

const EmailVerificationNotice: React.FC = () => {
  const { user, isAuthenticated, updateUser } = useAuthStore();
  const [isSending, setIsSending] = useState(false);

  const needsVerification = isAuthenticated && !!user && user.role !== 'ADMIN' && !user.email_verified;

  // El correo pudo verificarse desde otro navegador: sincronizar con el servidor
  useEffect(() => {
    if (!needsVerification) return;
    let cancelled = false;
    authService
      .getMe()
      .then((me) => {
        if (!cancelled && me.email_verified) updateUser({ email_verified: true });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsVerification]);

  if (!needsVerification) return null;

  const handleResend = async () => {
    setIsSending(true);
    try {
      const message = await authService.resendVerification();
      toast.success(message);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div role="status" className="bg-yellow-500/10 border-b border-yellow-500/30 text-yellow-200">
      <div className="mx-auto max-w-7xl px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm">
        <MailWarning className="h-5 w-5 flex-shrink-0" />
        <p className="flex-1">
          <strong>Verifique su correo.</strong> Revise la bandeja de {user?.email} y abra el enlace para poder
          realizar pedidos.
        </p>
        <button
          type="button"
          onClick={handleResend}
          disabled={isSending}
          className="font-semibold underline underline-offset-2 hover:text-white disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSending ? 'Enviando...' : 'Reenviar correo'}
        </button>
      </div>
    </div>
  );
};

export default EmailVerificationNotice;
