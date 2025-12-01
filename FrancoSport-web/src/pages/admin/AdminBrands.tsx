import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Save, X, Loader2, Globe, Tag, Upload, Image as ImageIcon } from 'lucide-react';
import * as adminBrandsService from '@/api/admin/brands.service';
import type { Brand, BrandFormData } from '@/api/admin/brands.service';
import { useConfirm } from '@/hooks/useConfirm';
import toast from 'react-hot-toast';

const AdminBrands: React.FC = () => {
  const { confirm } = useConfirm();
  
  // State
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Image upload state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState<BrandFormData>({
    name: '',
    slug: '',
    website_url: '',
    description: '',
    is_active: true
  });

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      setIsLoading(true);
      const response = await adminBrandsService.getBrands();
      setBrands(response.data);
    } catch (err) {
      console.error('Error fetching brands:', err);
      toast.error('Error al cargar marcas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (brand?: Brand) => {
    if (brand) {
      setEditingBrand(brand);
      setFormData({
        name: brand.name,
        slug: brand.slug,
        website_url: brand.website_url || '',
        description: brand.description || '',
        is_active: brand.is_active
      });
      setImagePreview(brand.logo_url || null);
    } else {
      setEditingBrand(null);
      setFormData({
        name: '',
        slug: '',
        website_url: '',
        description: '',
        is_active: true
      });
      setImagePreview(null);
    }
    setImageFile(null);
    setError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBrand(null);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    if (!editingBrand) {
      const slug = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormData(prev => ({ ...prev, name, slug }));
    } else {
      setFormData(prev => ({ ...prev, name }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setError(null);

      const data = new FormData();
      data.append('name', formData.name);
      data.append('slug', formData.slug);
      if (formData.website_url) data.append('website_url', formData.website_url);
      if (formData.description) data.append('description', formData.description);
      data.append('is_active', String(formData.is_active));

      if (imageFile) {
        data.append('image', imageFile);
      }

      if (editingBrand) {
        await adminBrandsService.updateBrand(editingBrand.id, data);
        toast.success('Marca actualizada exitosamente');
      } else {
        await adminBrandsService.createBrand(data);
        toast.success('Marca creada exitosamente');
      }

      handleCloseModal();
      fetchBrands();
    } catch (err: any) {
      console.error('Error saving brand:', err);
      const errorMessage = err.response?.data?.error?.message || 'Error al guardar marca';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    const isConfirmed = await confirm({
      title: 'Eliminar Marca',
      message: '¿Estás seguro de que deseas eliminar esta marca? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      variant: 'danger'
    });

    if (!isConfirmed) return;

    try {
      await adminBrandsService.deleteBrand(id);
      toast.success('Marca eliminada exitosamente');
      fetchBrands();
    } catch (err: any) {
      console.error('Error deleting brand:', err);
      toast.error(err.response?.data?.error?.message || 'Error al eliminar marca');
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await adminBrandsService.toggleBrandStatus(id);
      fetchBrands();
      toast.success('Estado actualizado');
    } catch (err: any) {
      console.error('Error toggling status:', err);
      toast.error(err.response?.data?.error?.message || 'Error al cambiar estado');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white mb-2">Marcas</h1>
          <p className="text-neutral-400">
            Gestiona las marcas de tus productos
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-primary text-black font-semibold rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Nueva Marca</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-[#1A1A1A] border border-neutral-800 rounded-xl p-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar marca..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-black border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Brands Table */}
      <div className="bg-[#1A1A1A] border border-neutral-800 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 text-primary mx-auto mb-4 animate-spin" />
            <p className="text-neutral-400">Cargando marcas...</p>
          </div>
        ) : brands.length === 0 ? (
          <div className="p-12 text-center">
            <Tag className="w-16 h-16 text-neutral-700 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No hay marcas</h3>
            <p className="text-neutral-400">
              {searchTerm ? 'No se encontraron marcas' : 'Comienza creando tu primera marca'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black">
                <tr>
                  <th className="text-left text-sm font-medium text-neutral-400 px-6 py-4">Nombre</th>
                  <th className="text-left text-sm font-medium text-neutral-400 px-6 py-4">Slug</th>
                  <th className="text-left text-sm font-medium text-neutral-400 px-6 py-4">Sitio Web</th>
                  <th className="text-left text-sm font-medium text-neutral-400 px-6 py-4">Productos</th>
                  <th className="text-left text-sm font-medium text-neutral-400 px-6 py-4">Estado</th>
                  <th className="text-right text-sm font-medium text-neutral-400 px-6 py-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {brands.map((brand) => (
                  <tr key={brand.id} className="border-t border-neutral-800 hover:bg-neutral-900/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <Tag className="w-5 h-5 text-neutral-500" />
                        <div>
                          <p className="font-medium text-white">{brand.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-sm text-neutral-400 bg-neutral-900 px-2 py-1 rounded">
                        {brand.slug}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      {brand.website_url ? (
                        <a
                          href={brand.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-1 text-sm text-primary hover:underline"
                        >
                          <Globe className="w-3 h-3" />
                          <span>Visitar</span>
                        </a>
                      ) : (
                        <span className="text-sm text-neutral-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-neutral-300">
                        {brand._count?.products || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(brand.id)}
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                          brand.is_active
                            ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                            : 'bg-neutral-500/10 text-neutral-500 hover:bg-neutral-500/20'
                        }`}
                      >
                        {brand.is_active ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenModal(brand)}
                          className="p-2 hover:bg-neutral-800 rounded-lg transition-colors text-primary"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(brand.id)}
                          className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-red-500"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1A1A1A] border border-neutral-800 rounded-xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-neutral-800">
              <h2 className="text-xl font-bold text-white">
                {editingBrand ? 'Editar Marca' : 'Nueva Marca'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500 rounded-lg p-3 text-sm text-red-500">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">
                  Logo
                </label>
                <div className="flex items-center space-x-4">
                  <div className="relative w-24 h-24 bg-neutral-900 rounded-lg overflow-hidden border border-neutral-800 flex items-center justify-center group">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-neutral-600" />
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <label className="cursor-pointer p-2 text-white hover:text-primary transition-colors">
                        <Upload className="w-5 h-5" />
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-neutral-400 mb-2">
                      Sube el logo de la marca.
                    </p>
                    <p className="text-xs text-neutral-500">
                      Formato: JPG, PNG. Máximo 5MB.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={handleNameChange}
                  className="w-full px-4 py-2 bg-black border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">
                  Slug
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-4 py-2 bg-black border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-primary font-mono text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">
                  Sitio Web (Opcional)
                </label>
                <input
                  type="url"
                  value={formData.website_url}
                  onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  className="w-full px-4 py-2 bg-black border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-primary"
                  placeholder="https://ejemplo.com"
                />
              </div>

              <div className="flex items-end mb-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-5 h-5 rounded border-neutral-800 bg-black text-primary focus:ring-primary"
                  />
                  <span className="text-white">Activo</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">
                  Descripción (Opcional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-black border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-neutral-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>Guardar</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBrands;
