import React, { useEffect, useState } from 'react';
import { adminPromotionsService } from '@/api/admin/promotions.service';
import type { Promotion, PromotionFormData } from '@/api/admin/promotions.service';
import { Button, Card, Badge } from '@/components/ui';
import { Plus, Edit, Trash2, Calendar, Percent, Zap, X, Loader2, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { useConfirm } from '@/hooks/useConfirm';
import { uploadImage } from '@/api/upload.service';

const AdminPromotions: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { confirm } = useConfirm();

  const [formData, setFormData] = useState<PromotionFormData>({
    title: '',
    description: '',
    discount_percent: undefined,
    start_date: '',
    end_date: '',
    is_active: true,
    image_url: '',
    product_id: undefined
  });

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      setIsLoading(true);
      const data = await adminPromotionsService.getPromotions();
      setPromotions(data);
    } catch (error) {
      toast.error('Error al cargar las promociones');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClick = () => {
    setSelectedPromotion(null);
    setFormData({
      title: '',
      description: '',
      discount_percent: undefined,
      start_date: '',
      end_date: '',
      is_active: true,
      image_url: '',
      product_id: undefined
    });
    setShowModal(true);
  };

  const handleEditClick = (promotion: Promotion) => {
    setSelectedPromotion(promotion);
    setFormData({
      title: promotion.title,
      description: promotion.description || '',
      discount_percent: promotion.discount_percent,
      start_date: new Date(promotion.start_date).toISOString().slice(0, 16),
      end_date: new Date(promotion.end_date).toISOString().slice(0, 16),
      is_active: promotion.is_active,
      image_url: promotion.image_url || '',
      product_id: promotion.product_id
    });
    setShowModal(true);
  };

  const handleDeleteClick = async (id: number) => {
    const isConfirmed = await confirm({
      title: 'Eliminar Promoción',
      message: '¿Estás seguro de que deseas eliminar esta promoción? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger'
    });

    if (isConfirmed) {
      try {
        await adminPromotionsService.deletePromotion(id);
        toast.success('Promoción eliminada correctamente');
        fetchPromotions();
      } catch (error) {
        toast.error('Error al eliminar la promoción');
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten archivos de imagen (JPG, PNG)');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no debe superar los 5MB');
      return;
    }

    try {
      setIsUploading(true);
      const uploadedImage = await uploadImage(file);
      setFormData({ ...formData, image_url: uploadedImage.url });
      toast.success('Imagen subida correctamente');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Error al subir la imagen');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      if (selectedPromotion) {
        await adminPromotionsService.updatePromotion(selectedPromotion.id, formData);
        toast.success('Promoción actualizada correctamente');
      } else {
        await adminPromotionsService.createPromotion(formData);
        toast.success('Promoción creada correctamente');
      }
      setShowModal(false);
      fetchPromotions();
    } catch (error) {
      toast.error('Error al guardar la promoción');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Promociones</h1>
          <p className="text-neutral-400">Gestiona las ofertas y campañas promocionales</p>
        </div>
        <Button onClick={handleCreateClick} leftIcon={<Plus className="w-4 h-4" />}>
          Nueva Promoción
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {promotions.map((promotion) => (
            <Card key={promotion.id} className="relative overflow-hidden group">
              {promotion.image_url && (
                <div className="h-40 overflow-hidden">
                  <img 
                    src={promotion.image_url} 
                    alt={promotion.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                </div>
              )}
              
              <div className="p-6 relative">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">{promotion.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-neutral-400">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {new Date(promotion.end_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Badge variant={promotion.is_active ? 'success' : 'default'}>
                    {promotion.is_active ? 'Activa' : 'Inactiva'}
                  </Badge>
                </div>

                {promotion.description && (
                  <p className="text-neutral-400 text-sm mb-4 line-clamp-2">
                    {promotion.description}
                  </p>
                )}

                <div className="flex items-center gap-4 mb-6">
                  {promotion.discount_percent && (
                    <div className="flex items-center gap-1 text-primary font-bold">
                      <Percent className="w-4 h-4" />
                      <span>{promotion.discount_percent}% OFF</span>
                    </div>
                  )}
                  {promotion.product && (
                    <div className="flex items-center gap-1 text-neutral-300 text-sm">
                      <Zap className="w-4 h-4" />
                      <span className="truncate max-w-[150px]">{promotion.product.name}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleEditClick(promotion)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-red-500 hover:text-red-600 hover:border-red-500/50"
                    onClick={() => handleDeleteClick(promotion.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-[#1A1A1A] rounded-xl border border-neutral-800 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">
                {selectedPromotion ? 'Editar Promoción' : 'Nueva Promoción'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">Título</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary h-24"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">Descuento (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.discount_percent || ''}
                    onChange={(e) => setFormData({ ...formData, discount_percent: parseInt(e.target.value) || undefined })}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">ID Producto (Opcional)</label>
                  <input
                    type="number"
                    value={formData.product_id || ''}
                    onChange={(e) => setFormData({ ...formData, product_id: parseInt(e.target.value) || undefined })}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">Fecha Inicio</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">Fecha Fin</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">Imagen Promocional</label>
                
                {formData.image_url ? (
                  <div className="relative rounded-lg overflow-hidden border border-neutral-800 group">
                    <img 
                      src={formData.image_url} 
                      alt="Preview" 
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, image_url: '' })}
                        className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-neutral-800 rounded-lg p-8 text-center hover:border-primary/50 transition-colors relative">
                    {isUploading ? (
                      <div className="flex flex-col items-center justify-center py-4">
                        <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                        <span className="text-sm text-neutral-400">Subiendo imagen...</span>
                      </div>
                    ) : (
                      <>
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/jpg, image/webp"
                          onChange={handleImageUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="flex flex-col items-center justify-center">
                          <Upload className="w-10 h-10 text-neutral-600 mb-3" />
                          <p className="text-white font-medium mb-1">Haz clic o arrastra una imagen</p>
                          <p className="text-sm text-neutral-500">JPG, PNG, WEBP (Máx. 5MB)</p>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded border-neutral-800 text-primary focus:ring-primary bg-neutral-900"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-white">Promoción Activa</label>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPromotions;
