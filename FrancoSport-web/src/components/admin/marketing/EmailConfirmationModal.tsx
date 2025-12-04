import React from 'react';
import { X, Rocket, Mail, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui';

interface EmailConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  campaignTitle: string;
  campaignSubject: string;
  userCount?: number; // Optional: if we want to show how many users will receive it
  isLoading?: boolean;
}

const EmailConfirmationModal: React.FC<EmailConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  campaignTitle,
  campaignSubject,
  isLoading = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={!isLoading ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative bg-[#1A1A1A] border border-neutral-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Decorative Header Background */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-primary/20 via-purple-500/10 to-transparent pointer-events-none" />

        {/* Close Button */}
        <button 
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white transition-colors rounded-full hover:bg-white/5 z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 relative z-0">
          {/* Icon */}
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full flex items-center justify-center mb-6 border border-white/5 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
            <Rocket className="w-10 h-10 text-primary animate-pulse" />
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h3 className="text-2xl font-black text-white mb-2">
              ¿Listo para despegar?
            </h3>
            <p className="text-neutral-400">
              Estás a punto de enviar una campaña masiva a todos tus usuarios.
            </p>
          </div>

          {/* Campaign Details Card */}
          <div className="bg-black/50 border border-neutral-800 rounded-xl p-4 mb-8 space-y-3">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-neutral-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-0.5">Asunto</p>
                <p className="text-white font-medium">{campaignSubject}</p>
              </div>
            </div>
            <div className="h-px bg-neutral-800" />
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-neutral-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-0.5">Título Interno</p>
                <p className="text-white font-medium">{campaignTitle}</p>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="flex gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl mb-8">
            <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0" />
            <p className="text-sm text-yellow-200/80">
              Esta acción no se puede deshacer. Asegúrate de que todo esté correcto antes de enviar.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1 border-neutral-700 hover:bg-neutral-800 text-white"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-bold py-2.5 px-4 rounded-lg shadow-lg shadow-primary/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4" />
                  <span>Enviar Campaña</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailConfirmationModal;
