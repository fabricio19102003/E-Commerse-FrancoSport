/**
 * Admin Shipping Page
 * Franco Sport E-Commerce
 * 
 * Gestión de métodos de envío (CRUD)
 */

import React, { useEffect, useState } from 'react';
import { adminShippingService } from '@/api/admin';
import type { ShippingMethod, ShippingMethodFormData } from '@/api/admin/shipping.service';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Loader2,
  Truck,
  Save,
  X,
  DollarSign,
  Clock
} from 'lucide-react';

import { useConfirm } from '@/hooks/useConfirm';

const AdminShipping: React.FC = () => {
  const [methods, setMethods] = useState<ShippingMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { confirm } = useConfirm();
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<ShippingMethod | null>(null);
  const [formData, setFormData] = useState<ShippingMethodFormData>({
    name: '',
    description: '',
    base_cost: 0,
    cost_per_kg: 0,
    estimated_days_min: 1,
    estimated_days_max: 3,
    is_active: true
  });
  const [isSaving, setIsSaving] = useState(false);

  // Fetch methods
  const fetchMethods = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await adminShippingService.getShippingMethods({ search: searchTerm });
      setMethods(response.data);
    } catch (err: any) {
      console.error('Error fetching shipping methods:', err);
      setError(err.response?.data?.error?.message || 'Error al cargar métodos de envío');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMethods();
  }, [searchTerm]);

  // Handle Create/Edit
  const handleOpenModal = (method?: ShippingMethod) => {
    if (method) {
      setEditingMethod(method);
      setFormData({
        name: method.name,
        description: method.description || '',
        base_cost: method.base_cost,
        cost_per_kg: method.cost_per_kg,
        estimated_days_min: method.estimated_days_min,
        estimated_days_max: method.estimated_days_max,
        is_active: method.is_active,
        shipping_zone_id: method.shipping_zone_id
      });
    } else {
      setEditingMethod(null);
      setFormData({
        name: '',
        description: '',
        base_cost: 0,
        cost_per_kg: 0,
        estimated_days_min: 1,
        estimated_days_max: 3,
        is_active: true
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMethod(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setError(null);

      if (editingMethod) {
        await adminShippingService.updateShippingMethod(editingMethod.id, formData);
        alert('Método de envío actualizado exitosamente');
      } else {
        await adminShippingService.createShippingMethod(formData);
        alert('Método de envío creado exitosamente');
      }

      handleCloseModal();
      fetchMethods();
    } catch (err: any) {
      console.error('Error saving shipping method:', err);
      setError(err.response?.data?.error?.message || 'Error al guardar método de envío');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Delete
  const handleDelete = async (id: number) => {
    const isConfirmed = await confirm({
      title: 'Eliminar Método de Envío',
      message: '¿Estás seguro de que deseas eliminar este método de envío? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      variant: 'danger'
    });

    if (!isConfirmed) return;

    try {
      await adminShippingService.deleteShippingMethod(id);
      alert('Método de envío eliminado exitosamente');
      fetchMethods();
    } catch (err: any) {
      console.error('Error deleting shipping method:', err);
      alert(err.response?.data?.error?.message || 'Error al eliminar método de envío');
    }
  };

  // Handle Toggle Status
  const handleToggleStatus = async (id: number) => {
    try {
      await adminShippingService.toggleShippingMethodStatus(id);
      fetchMethods();
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
          <h1 className="text-3xl font-black text-white mb-2">Envíos</h1>
          <p className="text-neutral-400">
            Gestiona los métodos y costos de envío
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-primary text-black font-semibold rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Nuevo Método</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-[#1A1A1A] border border-neutral-800 rounded-xl p-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
          <input
            type="text"
            placeholder="Buscar método..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-black border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Methods Table */}
      <div className="bg-[#1A1A1A] border border-neutral-800 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 text-primary mx-auto mb-4 animate-spin" />
            <p className="text-neutral-400">Cargando métodos de envío...</p>
          </div>
        ) : methods.length === 0 ? (
          <div className="p-12 text-center">
            <Truck className="w-16 h-16 text-neutral-700 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No hay métodos de envío</h3>
            <p className="text-neutral-400">
              {searchTerm ? 'No se encontraron métodos' : 'Comienza creando tu primer método de envío'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black">
                <tr>
                  <th className="text-left text-sm font-medium text-neutral-400 px-6 py-4">Nombre</th>
                  <th className="text-left text-sm font-medium text-neutral-400 px-6 py-4">Costo Base</th>
                  <th className="text-left text-sm font-medium text-neutral-400 px-6 py-4">Tiempo Estimado</th>
                  <th className="text-left text-sm font-medium text-neutral-400 px-6 py-4">Estado</th>
                  <th className="text-right text-sm font-medium text-neutral-400 px-6 py-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {methods.map((method) => (
                  <tr key={method.id} className="border-t border-neutral-800 hover:bg-neutral-900/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <Truck className="w-5 h-5 text-neutral-500" />
                        <div>
                          <p className="font-medium text-white">{method.name}</p>
                          {method.description && (
                            <p className="text-xs text-neutral-500">{method.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1 text-white font-medium">
                        <DollarSign className="w-4 h-4 text-green-500" />
                        <span>{method.base_cost}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1 text-neutral-300">
                        <Clock className="w-4 h-4 text-neutral-500" />
                        <span>{method.estimated_days_min} - {method.estimated_days_max} días</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(method.id)}
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                          method.is_active
                            ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                            : 'bg-neutral-500/10 text-neutral-500 hover:bg-neutral-500/20'
                        }`}
                      >
                        {method.is_active ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenModal(method)}
                          className="p-2 hover:bg-neutral-800 rounded-lg transition-colors text-primary"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(method.id)}
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
                {editingMethod ? 'Editar Método' : 'Nuevo Método'}
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
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-black border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-primary"
                  placeholder="Ej: Envío Estándar"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">
                    Costo Base ($)
                  </label>
                  <input
                    type="number"
                    value={formData.base_cost}
                    onChange={(e) => setFormData({ ...formData, base_cost: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 bg-black border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-primary"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">
                    Costo por Kg ($)
                  </label>
                  <input
                    type="number"
                    value={formData.cost_per_kg}
                    onChange={(e) => setFormData({ ...formData, cost_per_kg: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 bg-black border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-primary"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">
                    Días Mínimos
                  </label>
                  <input
                    type="number"
                    value={formData.estimated_days_min}
                    onChange={(e) => setFormData({ ...formData, estimated_days_min: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-black border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-primary"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">
                    Días Máximos
                  </label>
                  <input
                    type="number"
                    value={formData.estimated_days_max}
                    onChange={(e) => setFormData({ ...formData, estimated_days_max: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-black border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-primary"
                    min="0"
                    required
                  />
                </div>
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

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 rounded border-neutral-800 bg-black text-primary focus:ring-primary"
                />
                <label htmlFor="is_active" className="text-white cursor-pointer select-none">
                  Activar método inmediatamente
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-800">
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

export default AdminShipping;
