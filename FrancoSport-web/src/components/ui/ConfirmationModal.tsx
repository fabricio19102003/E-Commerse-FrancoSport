import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Info, X } from 'lucide-react';
import { Button } from '@/components/ui';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/utils/cn';

const ConfirmationModal: React.FC = () => {
  const { confirmationModal, closeConfirmation } = useUIStore();
  const { isOpen, title, message, confirmText, cancelText, variant } = confirmationModal;

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape') {
        closeConfirmation(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeConfirmation]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <AlertTriangle className="w-6 h-6 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
      case 'info':
        return <Info className="w-6 h-6 text-blue-500" />;
      default:
        return <Info className="w-6 h-6 text-primary" />;
    }
  };

  const getButtonVariant = () => {
    switch (variant) {
      case 'danger':
        return 'danger';
      case 'warning':
        return 'primary'; // Or a specific warning variant if available
      default:
        return 'primary';
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => closeConfirmation(false)}
      />

      {/* Modal */}
      <div className="relative bg-surface border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button 
          onClick={() => closeConfirmation(false)}
          className="absolute top-4 right-4 text-text-tertiary hover:text-text-primary transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6">
          <div className="flex gap-4">
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
              variant === 'danger' && "bg-red-500/10",
              variant === 'warning' && "bg-yellow-500/10",
              variant === 'info' && "bg-blue-500/10"
            )}>
              {getIcon()}
            </div>
            
            <div className="flex-1">
              <h3 className="text-lg font-bold text-text-primary mb-2">
                {title}
              </h3>
              <p className="text-text-secondary leading-relaxed">
                {message}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <Button 
              variant="outline" 
              onClick={() => closeConfirmation(false)}
            >
              {cancelText}
            </Button>
            <Button 
              variant={getButtonVariant()} 
              onClick={() => closeConfirmation(true)}
              autoFocus
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ConfirmationModal;
