/**
 * Admin Product Form
 * Franco Sport E-Commerce
 * 
 * Formulario para crear y editar productos - CONECTADO CON API
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { adminProductsService } from '@/api/admin';
import { uploadImage } from '@/api/upload.service';
import { ROUTES } from '@/constants/routes';
import {
  ArrowLeft,
  Save,
  Loader2,
  Upload,
  X,
  Star,
} from 'lucide-react';

// Validation Schema
const productSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  slug: z.string().min(3, 'El slug debe tener al menos 3 caracteres'),
  short_description: z.string().optional(),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  price: z.number().min(0, 'El precio debe ser mayor a 0'),
  compare_at_price: z.number().optional(),
  cost_price: z.number().min(0, 'El costo debe ser mayor a 0'),
  sku: z.string().min(2, 'El SKU debe tener al menos 2 caracteres'),
  barcode: z.string().optional(),
  stock: z.number().min(0, 'El stock no puede ser negativo'),
  low_stock_threshold: z.number().min(0, 'El umbral debe ser mayor a 0'),
  weight: z.number().min(0, 'El peso debe ser mayor a 0'),
  category_id: z.number().min(1, 'Selecciona una categoría'),
  brand_id: z.number().min(1, 'Selecciona una marca'),
  is_featured: z.boolean(),
  is_active: z.boolean(),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ImagePreview {
  file?: File;
  url: string;
  is_primary: boolean;
  cloudinary_public_id?: string;
}

const AdminProductForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Images
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      is_featured: false,
      is_active: true,
      low_stock_threshold: 10,
    },
  });

  const nameValue = watch('name');

  // Auto-generate slug from name
  useEffect(() => {
    if (nameValue && !isEditing) {
      const slug = nameValue
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setValue('slug', slug);
    }
  }, [nameValue, isEditing, setValue]);

  // Load product data if editing
  useEffect(() => {
    if (isEditing && id) {
      loadProduct(parseInt(id));
    }
  }, [isEditing, id]);

  const loadProduct = async (productId: number) => {
    try {
      setIsLoading(true);
      const product = await adminProductsService.getProduct(productId);

      // Set form values
      setValue('name', product.name);
      setValue('slug', product.slug);
      setValue('short_description', product.short_description || '');
      setValue('description', product.description);
      setValue('price', parseFloat(product.price.toString()));
      setValue('compare_at_price', product.compare_at_price ? parseFloat(product.compare_at_price.toString()) : undefined);
      setValue('cost_price', parseFloat((product.cost_price || 0).toString()));
      setValue('sku', product.sku);
      setValue('barcode', product.barcode || '');
      setValue('stock', product.stock);
      setValue('low_stock_threshold', product.low_stock_threshold);
      setValue('weight', parseFloat(product.weight.toString()));
      setValue('category_id', product.category_id);
      setValue('brand_id', product.brand_id);
      setValue('is_featured', product.is_featured);
      setValue('is_active', product.is_active);
      setValue('meta_title', product.meta_title || '');
      setValue('meta_description', product.meta_description || '');

      // Set images
      if (product.images && product.images.length > 0) {
        setImages(
          product.images.map((img: any) => ({
            url: img.url,
            is_primary: img.is_primary,
            cloudinary_public_id: img.url.split('/').pop()?.split('.')[0],
          }))
        );
      }
    } catch (err: any) {
      console.error('Error loading product:', err);
      setError(err.response?.data?.error?.message || 'Error al cargar producto');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle image upload
  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newImages: ImagePreview[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Solo se permiten archivos de imagen');
        continue;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('El tamaño máximo de imagen es 5MB');
        continue;
      }

      // Create preview
      const preview: ImagePreview = {
        file,
        url: URL.createObjectURL(file),
        is_primary: images.length === 0 && i === 0,
      };

      newImages.push(preview);
    }

    setImages([...images, ...newImages]);
  };

  // Handle drag & drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleImageUpload(e.dataTransfer.files);
  };

  // Remove image
  const removeImage = (index: number) => {
    const newImages = [...images];
    const removedImage = newImages[index];

    // Revoke object URL if it's a local file
    if (removedImage.file) {
      URL.revokeObjectURL(removedImage.url);
    }

    newImages.splice(index, 1);

    // If removed image was primary, set first image as primary
    if (removedImage.is_primary && newImages.length > 0) {
      newImages[0].is_primary = true;
    }

    setImages(newImages);
  };

  // Set primary image
  const setPrimaryImage = (index: number) => {
    const newImages = images.map((img, i) => ({
      ...img,
      is_primary: i === index,
    }));
    setImages(newImages);
  };

  // Handle form submit
  const onSubmit = async (data: ProductFormData) => {
    try {
      // Validate images
      if (images.length === 0) {
        alert('Debes agregar al menos una imagen');
        return;
      }

      setIsSaving(true);
      setError(null);
      setUploadProgress(10);

      // Upload new images to Cloudinary
      // Upload new images to Cloudinary in parallel
      const uploadPromises = images.map(async (img, index) => {
        if (img.file) {
          try {
            const uploaded = await uploadImage(img.file);
            setUploadProgress((prev) => Math.min(prev + (50 / images.length), 60));
            return {
              url: uploaded.url,
              is_primary: img.is_primary,
              display_order: index,
              alt_text: data.name,
            };
          } catch (error) {
            console.error('Error uploading image:', error);
            throw new Error(`Error al subir la imagen ${index + 1}`);
          }
        } else {
          return {
            url: img.url,
            is_primary: img.is_primary,
            display_order: index,
            alt_text: data.name,
          };
        }
      });

      const uploadedImages = await Promise.all(uploadPromises);

      setUploadProgress(70);

      // Prepare product data
      const productData = {
        ...data,
        images: uploadedImages,
      };

      setUploadProgress(80);

      // Create or update product
      if (isEditing && id) {
        await adminProductsService.updateProduct(parseInt(id), productData);
        alert('Producto actualizado exitosamente');
      } else {
        await adminProductsService.createProduct(productData);
        alert('Producto creado exitosamente');
      }

      setUploadProgress(100);

      // Redirect to products list
      setTimeout(() => {
        navigate(ROUTES.ADMIN_PRODUCTS);
      }, 500);
    } catch (err: any) {
      console.error('Error saving product:', err);
      setError(err.response?.data?.error?.message || 'Error al guardar producto');
      setUploadProgress(0);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary mx-auto mb-4 animate-spin" />
          <p className="text-neutral-400">Cargando producto...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            to={ROUTES.ADMIN_PRODUCTS}
            className="inline-flex items-center space-x-2 text-neutral-400 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a productos</span>
          </Link>
          <h1 className="text-3xl font-black text-white">
            {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
          </h1>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500 rounded-xl p-4">
          <p className="text-red-500 font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-[#1A1A1A] border border-neutral-800 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Información Básica</h2>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  {...register('name')}
                  className="w-full px-4 py-2 bg-black border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-primary"
                  placeholder="Ej: Camiseta Franco Sport Elite"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Slug (URL) *
                </label>
                <input
                  type="text"
                  {...register('slug')}
                  className="w-full px-4 py-2 bg-black border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-primary font-mono text-sm"
                  placeholder="camiseta-franco-sport-elite"
                />
                {errors.slug && (
                  <p className="text-red-500 text-sm mt-1">{errors.slug.message}</p>
                )}
              </div>

              {/* Short Description */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Descripción Corta
                </label>
                <input
                  type="text"
                  {...register('short_description')}
                  className="w-full px-4 py-2 bg-black border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-primary"
                  placeholder="Breve descripción del producto"
                  maxLength={160}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Descripción Completa *
                </label>
                <textarea
                  {...register('description')}
                  rows={6}
                  className="w-full px-4 py-2 bg-black border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-primary resize-none"
                  placeholder="Descripción detallada del producto..."
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="bg-[#1A1A1A] border border-neutral-800 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Imágenes del Producto</h2>

            {/* Upload Area */}
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-neutral-800 hover:border-neutral-700'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                type="file"
                id="images"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                multiple
                onChange={(e) => handleImageUpload(e.target.files)}
                className="hidden"
              />
              <label htmlFor="images" className="cursor-pointer">
                <Upload className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                <p className="text-white font-medium mb-2">
                  Arrastra imágenes aquí o haz clic para seleccionar
                </p>
                <p className="text-sm text-neutral-400">
                  JPG, PNG o WEBP - Máximo 5MB por imagen
                </p>
              </label>
            </div>

            {/* Image Previews */}
            {images.length > 0 && (
              <div className="mt-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {images.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={img.url}
                        alt={`Preview ${index + 1}`}
                        className="w-full aspect-square object-cover rounded-lg border-2 border-neutral-800"
                      />
                      {img.is_primary && (
                        <div className="absolute top-2 left-2">
                          <span className="inline-flex items-center space-x-1 px-2 py-1 bg-primary text-black text-xs font-bold rounded">
                            <Star className="w-3 h-3" />
                            <span>Principal</span>
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2">
                        {!img.is_primary && (
                          <button
                            type="button"
                            onClick={() => setPrimaryImage(index)}
                            className="px-3 py-1.5 bg-primary text-black text-sm font-medium rounded hover:bg-primary/90"
                          >
                            Hacer Principal
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Pricing */}
          <div className="bg-[#1A1A1A] border border-neutral-800 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Precios</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Precio de Venta *
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('price', { valueAsNumber: true })}
                  className="w-full px-4 py-2 bg-black border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-primary"
                  placeholder="0.00"
                />
                {errors.price && (
                  <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Precio de Comparación
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('compare_at_price', { valueAsNumber: true })}
                  className="w-full px-4 py-2 bg-black border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-primary"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Costo de Adquisición *
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('cost_price', { valueAsNumber: true })}
                  className="w-full px-4 py-2 bg-black border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-primary"
                  placeholder="0.00"
                />
                {errors.cost_price && (
                  <p className="text-red-500 text-sm mt-1">{errors.cost_price.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Inventory */}
          <div className="bg-[#1A1A1A] border border-neutral-800 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Inventario</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  SKU *
                </label>
                <input
                  type="text"
                  {...register('sku')}
                  className="w-full px-4 py-2 bg-black border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-primary font-mono"
                  placeholder="PROD-001"
                />
                {errors.sku && (
                  <p className="text-red-500 text-sm mt-1">{errors.sku.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Código de Barras
                </label>
                <input
                  type="text"
                  {...register('barcode')}
                  className="w-full px-4 py-2 bg-black border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-primary font-mono"
                  placeholder="7501234567890"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Stock Actual *
                </label>
                <input
                  type="number"
                  {...register('stock', { valueAsNumber: true })}
                  className="w-full px-4 py-2 bg-black border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-primary"
                  placeholder="0"
                />
                {errors.stock && (
                  <p className="text-red-500 text-sm mt-1">{errors.stock.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Umbral Stock Bajo *
                </label>
                <input
                  type="number"
                  {...register('low_stock_threshold', { valueAsNumber: true })}
                  className="w-full px-4 py-2 bg-black border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-primary"
                  placeholder="10"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Peso (kg) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('weight', { valueAsNumber: true })}
                  className="w-full px-4 py-2 bg-black border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-primary"
                  placeholder="0.00"
                />
                {errors.weight && (
                  <p className="text-red-500 text-sm mt-1">{errors.weight.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* SEO */}
          <div className="bg-[#1A1A1A] border border-neutral-800 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">SEO</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Meta Título (máx. 60 caracteres)
                </label>
                <input
                  type="text"
                  {...register('meta_title')}
                  className="w-full px-4 py-2 bg-black border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-primary"
                  placeholder="Título optimizado para motores de búsqueda"
                  maxLength={60}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Meta Descripción (máx. 160 caracteres)
                </label>
                <textarea
                  {...register('meta_description')}
                  rows={3}
                  className="w-full px-4 py-2 bg-black border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-primary resize-none"
                  placeholder="Descripción breve para motores de búsqueda"
                  maxLength={160}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Organization */}
          <div className="bg-[#1A1A1A] border border-neutral-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Organización</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Categoría *
                </label>
                <select
                  {...register('category_id', { valueAsNumber: true })}
                  className="w-full px-4 py-2 bg-black border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-primary"
                >
                  <option value="">Seleccionar</option>
                  <option value={1}>Elite</option>
                  <option value={2}>Pro</option>
                  <option value={3}>Sport</option>
                </select>
                {errors.category_id && (
                  <p className="text-red-500 text-sm mt-1">{errors.category_id.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Marca *
                </label>
                <select
                  {...register('brand_id', { valueAsNumber: true })}
                  className="w-full px-4 py-2 bg-black border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-primary"
                >
                  <option value="">Seleccionar</option>
                  <option value={1}>Franco Sport</option>
                  <option value={2}>Racing Elite</option>
                  <option value={3}>Legacy</option>
                </select>
                {errors.brand_id && (
                  <p className="text-red-500 text-sm mt-1">{errors.brand_id.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="bg-[#1A1A1A] border border-neutral-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Estado</h3>

            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('is_active')}
                  className="w-5 h-5 rounded border-neutral-700 bg-black text-primary focus:ring-primary focus:ring-offset-0"
                />
                <div>
                  <span className="text-white font-medium">Producto Activo</span>
                  <p className="text-sm text-neutral-400">
                    El producto será visible en la tienda
                  </p>
                </div>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('is_featured')}
                  className="w-5 h-5 rounded border-neutral-700 bg-black text-primary focus:ring-primary focus:ring-offset-0"
                />
                <div>
                  <span className="text-white font-medium">Producto Destacado</span>
                  <p className="text-sm text-neutral-400">
                    Aparecerá en la sección de destacados
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="bg-[#1A1A1A] border border-neutral-800 rounded-xl p-6">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full inline-flex items-center justify-center space-x-2 px-6 py-3 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Guardando... {uploadProgress}%</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>{isEditing ? 'Actualizar Producto' : 'Crear Producto'}</span>
                </>
              )}
            </button>

            {isSaving && (
              <div className="mt-3">
                <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default AdminProductForm;
