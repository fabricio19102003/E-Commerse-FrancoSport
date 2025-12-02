import React, { useEffect, useState } from 'react';
import { adminPaymentService } from '@/api/admin/payment.service';
import { paymentService } from '@/api/payment.service';
import type { PaymentConfig } from '@/api/payment.service';
import { Save, Loader2, QrCode, X } from 'lucide-react';

const AdminPaymentSettings: React.FC = () => {
  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [instructions, setInstructions] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setIsLoading(true);
      const response = await paymentService.getPaymentConfig();
      setConfig(response.data);
      setInstructions(response.data.instructions || '');
      setIsActive(response.data.is_active);
      if (response.data.qr_code_url) {
        setPreviewUrl(response.data.qr_code_url);
      }
    } catch (error) {
      console.error('Error fetching config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setQrFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await adminPaymentService.updatePaymentConfig({
        instructions,
        is_active: isActive,
        qr_code: qrFile || undefined
      });
      alert('Configuración guardada exitosamente');
      fetchConfig(); // Refresh
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Error al guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white mb-2">Configuración de Pagos</h1>
          <p className="text-neutral-400">Gestiona los métodos de pago y códigos QR</p>
        </div>
      </div>

      <div className="bg-[#1A1A1A] border border-neutral-800 rounded-xl p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Active Toggle */}
          <div className="flex items-center space-x-3 bg-black/50 p-4 rounded-lg border border-neutral-800">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-5 h-5 rounded border-neutral-800 bg-black text-primary focus:ring-primary"
            />
            <label htmlFor="isActive" className="text-white font-medium cursor-pointer select-none">
              Habilitar Pago por Transferencia Bancaria
            </label>
          </div>

          {/* QR Code Upload */}
          <div className="relative">
            <label className="block text-sm font-medium text-neutral-400 mb-2">Código QR (JPG/PNG)</label>
            <div className="border-2 border-dashed border-neutral-800 rounded-xl p-8 text-center hover:border-primary/50 transition-colors bg-black/30 relative">
              {previewUrl ? (
                <div className="relative inline-block">
                  <img src={previewUrl} alt="QR Code Preview" className="max-w-xs rounded-lg shadow-lg mx-auto" />
                  <button
                    type="button"
                    onClick={(e) => { 
                      e.preventDefault();
                      setQrFile(null); 
                      setPreviewUrl(config?.qr_code_url || null); 
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 z-10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2 pointer-events-none">
                  <QrCode className="w-12 h-12 text-neutral-600 mx-auto" />
                  <p className="text-neutral-400 text-sm">Arrastra tu imagen aquí o haz clic para seleccionar</p>
                </div>
              )}
              <input
                type="file"
                accept="image/png, image/jpeg, image/jpg"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2">Instrucciones de Pago</label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={5}
              placeholder="Ej: Realiza la transferencia a la cuenta X del Banco Y..."
              className="w-full px-4 py-3 bg-black border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-primary resize-none"
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-4 border-t border-neutral-800">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-3 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Guardar Configuración</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AdminPaymentSettings;
