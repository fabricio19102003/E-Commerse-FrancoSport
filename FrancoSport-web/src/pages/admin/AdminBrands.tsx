/**
 * Admin Brands Page
 * Franco Sport E-Commerce
 * 
 * Gestión de marcas (CRUD)
 */

import React, { useEffect, useState } from 'react';
import { adminBrandsService } from '@/api/admin';
import type { Brand, BrandFormData } from '@/api/admin/brands.service';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Loader2,
  Tag,
  Save,
  X,
  Globe
} from 'lucide-react';

import { useConfirm } from '@/hooks/useConfirm';

const AdminBrands: React.FC = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { confirm } = useConfirm();
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [formData, setFormData] = useState<BrandFormData>({
    name: '',
    slug: '',
    description: '',
    website_url: '',
    is_active: true
  });
  const [isSaving, setIsSaving] = useState(false);

  // Fetch brands
  const fetchBrands = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await adminBrandsService.getBrands({ search: searchTerm });
      setBrands(response.data);
    } catch (err: any) {
      console.error('Error fetching brands:', err);
      setError(err.response?.data?.error?.message || 'Error al cargar marcas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, [searchTerm]);

  // Handle Create/Edit
  const handleOpenModal = (brand?: Brand) => {
    if (brand) {
      setEditingBrand(brand);
      setFormData({
        name: brand.name,
        slug: brand.slug,
        description: brand.description || '',
        website_url: brand.website_url || '',
        is_active: brand.is_active
      });
    } else {
      setEditingBrand(null);
      setFormData({
        name: '',
        slug: '',
        description: '',
        website_url: '',
        is_active: true
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBrand(null);
    setError(null);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      slug: !editingBrand ? generateSlug(name) : prev.slug
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setError(null);

      if (editingBrand) {
        await adminBrandsService.updateBrand(editingBrand.id, formData);
        alert('Marca actualizada exitosamente');
      } else {
        await adminBrandsService.createBrand(formData);
        alert('Marca creada exitosamente');
      }

      handleCloseModal();
      fetchBrands();
    } catch (err: any) {
      console.error('Error saving brand:', err);
      setError(err.response?.data?.error?.message || 'Error al guardar marca');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Delete
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
      alert('Marca eliminada exitosamente');
      fetchBrands();
    } catch (err: any) {
      console.error('Error deleting brand:', err);
      alert(err.response?.data?.error?.message || 'Error al eliminar marca');
    }
  };

  // Handle Toggle Status
  const handleToggleStatus = async (id: number) => {
    try {
      await adminBrandsService.toggleBrandStatus(id);
      fetchBrands();
    } catch (err: any) {
      console.error('Error toggling status:', err);
      alert(err.response?.data?.error?.message || 'Error al cambiar estado');
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
