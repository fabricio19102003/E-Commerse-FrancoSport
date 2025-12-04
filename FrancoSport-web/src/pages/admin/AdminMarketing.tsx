import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Send, Eye, Image as ImageIcon, Link as LinkIcon, Mail, Upload, Zap } from 'lucide-react';
import api from '@/api/axios';
import EmailConfirmationModal from '@/components/admin/marketing/EmailConfirmationModal';

interface MarketingFormData {
  subject: string;
  title: string;
  message: string;
  imageUrl: string;
  link: string;
  linkText: string;
  imageFile?: FileList;
}

interface Promotion {
  id: string;
  title: string;
  description: string;
  image_url: string;
  discount_percent: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

const AdminMarketing: React.FC = () => {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingData, setPendingData] = useState<MarketingFormData | null>(null);
  
  const { register, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm<MarketingFormData>();

  const formData = watch();

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      const response = await api.get('/promotions/active');
      setPromotions(response.data);
    } catch (error) {
      console.error('Error fetching promotions:', error);
    }
  };

  const handlePromotionSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const promotionId = e.target.value;
    if (!promotionId) return;

    const promotion = promotions.find(p => p.id === promotionId);
    if (promotion) {
      setValue('title', promotion.title);
      setValue('message', promotion.description);
      setValue('imageUrl', promotion.image_url || '');
      setValue('link', `${window.location.origin}/promociones/${promotion.id}`);
      setValue('linkText', 'Ver Oferta');
      setValue('subject', `¡Nueva Oferta: ${promotion.title}!`);
      setSelectedImagePreview(promotion.image_url || null);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const createFormData = (data: MarketingFormData, testEmail?: string) => {
    const formData = new FormData();
    formData.append('subject', data.subject);
    formData.append('title', data.title);
    formData.append('message', data.message);
    formData.append('link', data.link || '');
    formData.append('linkText', data.linkText || '');
    
    if (data.imageUrl) {
      formData.append('imageUrl', data.imageUrl);
    }

    if (data.imageFile && data.imageFile[0]) {
      formData.append('image', data.imageFile[0]);
    }

    if (testEmail) {
      formData.append('testEmail', testEmail);
    }

    return formData;
  };

  const onSubmit = async (data: MarketingFormData) => {
    setPendingData(data);
    setShowConfirmation(true);
  };

  const handleConfirmSend = async () => {
    if (!pendingData) return;
    
    setIsLoading(true);
    try {
      const formData = createFormData(pendingData);
      const response = await api.post('/admin/marketing/send', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(response.data.message);
      reset();
      setSelectedImagePreview(null);
      setShowConfirmation(false);
      setPendingData(null);
    } catch (error: any) {
      console.error('Error sending campaign:', error);
      toast.error(error.response?.data?.message || 'Error al enviar la campaña');
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestEmail = async () => {
    const data = watch();
    if (!data.subject || !data.title || !data.message) {
      toast.error('Por favor completa los campos obligatorios (Asunto, Título, Mensaje) para enviar una prueba.');
      return;
    }

    const testEmail = prompt('Ingresa el correo electrónico para la prueba:');
    if (!testEmail) return;

    setIsLoading(true);
    try {
      const formData = createFormData(data, testEmail);
      const response = await api.post('/admin/marketing/send', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(response.data.message);
    } catch (error: any) {
      console.error('Error sending test email:', error);
      toast.error(error.response?.data?.message || 'Error al enviar el email de prueba');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Email Marketing</h1>
          <p className="text-neutral-400">Envía correos promocionales y anuncios a tus usuarios.</p>
        </div>
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className="flex items-center px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors"
          >
            <Eye className="w-5 h-5 mr-2" />
            {isPreviewMode ? 'Editar' : 'Vista Previa'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Section */}
        <div className={`space-y-6 ${isPreviewMode ? 'hidden lg:block' : ''}`}>
          <div className="bg-[#1A1A1A] border border-neutral-800 rounded-xl p-6">
            
            {/* Promotion Selector */}
            <div className="mb-8 p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <label className="block text-sm font-medium text-primary mb-2 flex items-center">
                <Zap className="w-4 h-4 mr-2" />
                Cargar desde Promoción Activa
              </label>
              <select
                onChange={handlePromotionSelect}
                className="w-full bg-[#0A0A0A] border border-neutral-800 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-primary transition-colors"
              >
                <option value="">Seleccionar una promoción...</option>
                {promotions.map(promo => (
                  <option key={promo.id} value={promo.id}>
                    {promo.title} ({promo.discount_percent}% OFF)
                  </option>
                ))}
              </select>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">
                  Asunto del Correo *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                  <input
                    {...register('subject', { required: 'El asunto es obligatorio' })}
                    type="text"
                    className="w-full bg-[#0A0A0A] border border-neutral-800 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-neutral-600 focus:outline-none focus:border-primary transition-colors"
                    placeholder="Ej: ¡Gran Venta de Fin de Temporada!"
                  />
                </div>
                {errors.subject && (
                  <p className="mt-1 text-sm text-red-500">{errors.subject.message}</p>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">
                  Título Principal *
                </label>
                <input
                  {...register('title', { required: 'El título es obligatorio' })}
                  type="text"
                  className="w-full bg-[#0A0A0A] border border-neutral-800 rounded-lg py-2.5 px-4 text-white placeholder-neutral-600 focus:outline-none focus:border-primary transition-colors"
                  placeholder="Ej: 50% OFF en Todo"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>
                )}
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">
                  Imagen Principal
                </label>
                <div className="space-y-4">
                  {/* URL Input (Hidden if file selected, or kept for fallback) */}
                  <div className="relative">
                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                    <input
                      {...register('imageUrl')}
                      type="url"
                      className="w-full bg-[#0A0A0A] border border-neutral-800 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-neutral-600 focus:outline-none focus:border-primary transition-colors"
                      placeholder="URL de la imagen (o sube una abajo)"
                      onChange={(e) => setSelectedImagePreview(e.target.value)}
                    />
                  </div>

                  {/* File Input */}
                  <div className="relative">
                    <input
                      {...register('imageFile')}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-neutral-700 rounded-lg cursor-pointer hover:border-primary hover:bg-neutral-800/50 transition-colors"
                    >
                      <Upload className="w-5 h-5 text-neutral-400 mr-2" />
                      <span className="text-neutral-400">Subir imagen (JPG, PNG)</span>
                    </label>
                  </div>

                  {selectedImagePreview && (
                    <div className="relative w-full h-48 bg-neutral-900 rounded-lg overflow-hidden">
                      <img
                        src={selectedImagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedImagePreview(null);
                          setValue('imageUrl', '');
                          setValue('imageFile', undefined);
                        }}
                        className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-red-500 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">
                  Mensaje *
                </label>
                <textarea
                  {...register('message', { required: 'El mensaje es obligatorio' })}
                  rows={6}
                  className="w-full bg-[#0A0A0A] border border-neutral-800 rounded-lg py-3 px-4 text-white placeholder-neutral-600 focus:outline-none focus:border-primary transition-colors resize-none"
                  placeholder="Escribe el contenido de tu correo aquí..."
                />
                {errors.message && (
                  <p className="mt-1 text-sm text-red-500">{errors.message.message}</p>
                )}
              </div>

              {/* Link */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">
                    Enlace del Botón (Opcional)
                  </label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                    <input
                      {...register('link')}
                      type="url"
                      className="w-full bg-[#0A0A0A] border border-neutral-800 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-neutral-600 focus:outline-none focus:border-primary transition-colors"
                      placeholder="https://francosport.com/ofertas"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">
                    Texto del Botón
                  </label>
                  <input
                    {...register('linkText')}
                    type="text"
                    className="w-full bg-[#0A0A0A] border border-neutral-800 rounded-lg py-2.5 px-4 text-white placeholder-neutral-600 focus:outline-none focus:border-primary transition-colors"
                    placeholder="Ej: Ver Ofertas"
                    defaultValue="Ver Más"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={sendTestEmail}
                  disabled={isLoading}
                  className="flex-1 px-6 py-3 bg-neutral-800 text-white font-semibold rounded-lg hover:bg-neutral-700 transition-colors disabled:opacity-50"
                >
                  Enviar Prueba
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center px-6 py-3 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  <Send className="w-5 h-5 mr-2" />
                  {isLoading ? 'Enviando...' : 'Enviar a Todos'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Preview Section */}
        <div className={`space-y-6 ${!isPreviewMode ? 'hidden lg:block' : ''}`}>
          <div className="sticky top-24">
            <h3 className="text-lg font-semibold text-white mb-4">Vista Previa</h3>
            <div className="bg-white rounded-xl overflow-hidden shadow-xl max-w-[600px] mx-auto text-black">
              {/* Header */}
              <div className="bg-black text-white p-8 text-center">
                {/* Logo Preview */}
                <img 
                  src="/email-logo.jpg" 
                  alt="Franco Sport" 
                  className="h-auto max-w-[150px] mx-auto mb-4" 
                />
                <div className="text-sm tracking-widest uppercase opacity-80">No es suerte, es esfuerzo</div>
              </div>

              {/* Content */}
              <div className="p-8">
                <div className="text-center">
                  <h2 className="text-2xl font-bold uppercase tracking-wide mb-6 text-black">
                    {formData.title || 'Título del Correo'}
                  </h2>

                  {selectedImagePreview && (
                    <div className="mb-6">
                      <img
                        src={selectedImagePreview}
                        alt="Preview"
                        className="max-w-full rounded-lg shadow-md mx-auto"
                      />
                    </div>
                  )}

                  <div className="text-base leading-relaxed text-neutral-700 mb-8 text-left whitespace-pre-wrap">
                    {formData.message || 'Aquí aparecerá el contenido de tu mensaje...'}
                  </div>

                  {formData.link && (
                    <div className="mt-8">
                      <a
                        href="#"
                        className="inline-block px-8 py-3.5 bg-black text-white font-bold uppercase tracking-wide rounded text-sm no-underline"
                        onClick={(e) => e.preventDefault()}
                      >
                        {formData.linkText || 'Ver Más'}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="bg-neutral-100 p-8 text-center text-xs text-neutral-500 border-t border-neutral-200">
                <p className="mb-2">&copy; {new Date().getFullYear()} Franco Sport. Todos los derechos reservados.</p>
                <p>Este correo fue enviado porque te registraste en nuestra tienda.</p>
                <div className="mt-4 space-x-2">
                  <span>Instagram</span> • <span>Facebook</span> • <span>TikTok</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <EmailConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleConfirmSend}
        campaignTitle={pendingData?.title || ''}
        campaignSubject={pendingData?.subject || ''}
        isLoading={isLoading}
      />
    </div>
  );
};

export default AdminMarketing;
