/**
 * Admin Coupons Page
 * Franco Sport E-Commerce
 * 
 * Gestión de cupones de descuento (CRUD)
 */

import React, { useEffect, useState } from 'react';
import { adminCouponsService } from '@/api/admin';
import type { Coupon, CouponFormData } from '@/api/admin/coupons.service';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Loader2,
  Ticket,
  Save,
  X,
  Calendar,
  DollarSign,
  Percent
} from 'lucide-react';

import { useConfirm } from '@/hooks/useConfirm';

const AdminCoupons: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { confirm } = useConfirm();
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState<CouponFormData>({
    code: '',
    discount_type: 'PERCENTAGE',
    discount_value: 0,
    min_purchase_amount: 0,
    max_discount_amount: 0,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    usage_limit: 0,
    is_active: true
  });
  const [isSaving, setIsSaving] = useState(false);

  // Fetch coupons
  const fetchCoupons = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await adminCouponsService.getCoupons({ search: searchTerm });
      setCoupons(response.data);
    } catch (err: any) {
      console.error('Error fetching coupons:', err);
      setError(err.response?.data?.error?.message || 'Error al cargar cupones');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [searchTerm]);

  // Handle Create/Edit
  const handleOpenModal = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData({
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        min_purchase_amount: coupon.min_purchase_amount || 0,
        max_discount_amount: coupon.max_discount_amount || 0,
        start_date: new Date(coupon.start_date).toISOString().split('T')[0],
        end_date: new Date(coupon.end_date).toISOString().split('T')[0],
        usage_limit: coupon.usage_limit || 0,
        is_active: coupon.is_active
      });
    } else {
      setEditingCoupon(null);
      setFormData({
        code: '',
        discount_type: 'PERCENTAGE',
        discount_value: 0,
        min_purchase_amount: 0,
        max_discount_amount: 0,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        usage_limit: 0,
        is_active: true
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCoupon(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setError(null);

      const dataToSend = {
        ...formData,
        min_purchase_amount: formData.min_purchase_amount || undefined,
        max_discount_amount: formData.max_discount_amount || undefined,
        usage_limit: formData.usage_limit || undefined
      };

      if (editingCoupon) {
        await adminCouponsService.updateCoupon(editingCoupon.id, dataToSend);
        alert('Cupón actualizado exitosamente');
      } else {
        await adminCouponsService.createCoupon(dataToSend);
        alert('Cupón creado exitosamente');
      }

      handleCloseModal();
      fetchCoupons();
    } catch (err: any) {
      console.error('Error saving coupon:', err);
      setError(err.response?.data?.error?.message || 'Error al guardar cupón');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Delete
  const handleDelete = async (id: number) => {
    const isConfirmed = await confirm({
      title: 'Eliminar Cupón',
      message: '¿Estás seguro de que deseas eliminar este cupón? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      variant: 'danger'
    });

    if (!isConfirmed) return;

    try {
      await adminCouponsService.deleteCoupon(id);
      alert('Cupón eliminado exitosamente');
      fetchCoupons();
    } catch (err: any) {
      console.error('Error deleting coupon:', err);
      alert(err.response?.data?.error?.message || 'Error al eliminar cupón');
    }
  };

  // Handle Toggle Status
  const handleToggleStatus = async (id: number) => {
    try {
      await adminCouponsService.toggleCouponStatus(id);
      fetchCoupons();
    } catch (err: any) {
      console.error('Error toggling status:', err);
      alert(err.response?.data?.error?.message || 'Error al cambiar estado');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white mb-2">Cupones</h1>
          <p className="text-neutral-400">
            Gestiona los códigos de descuento
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-primary text-black font-semibold rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Nuevo Cupón</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-[#1A1A1A] border border-neutral-800 rounded-xl p-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-black border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-[#1A1A1A] border border-neutral-800 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 text-primary mx-auto mb-4 animate-spin" />
            <p className="text-neutral-400">Cargando cupones...</p>
          </div>
        ) : coupons.length === 0 ? (
          <div className="p-12 text-center">
            <Ticket className="w-16 h-16 text-neutral-700 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No hay cupones</h3>
            <p className="text-neutral-400">
              {searchTerm ? 'No se encontraron cupones' : 'Comienza creando tu primer cupón'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black">
                <tr>
                  <th className="text-left text-sm font-medium text-neutral-400 px-6 py-4">Código</th>
                  <th className="text-left text-sm font-medium text-neutral-400 px-6 py-4">Descuento</th>
                  <th className="text-left text-sm font-medium text-neutral-400 px-6 py-4">Vigencia</th>
                  <th className="text-left text-sm font-medium text-neutral-400 px-6 py-4">Uso</th>
                  <th className="text-left text-sm font-medium text-neutral-400 px-6 py-4">Estado</th>
                  <th className="text-right text-sm font-medium text-neutral-400 px-6 py-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="border-t border-neutral-800 hover:bg-neutral-900/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <Ticket className="w-5 h-5 text-neutral-500" />
                        <div>
                          <p className="font-medium text-white font-mono">{coupon.code}</p>
                          {coupon.min_purchase_amount && (
                            <p className="text-xs text-neutral-500">Min: ${coupon.min_purchase_amount}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1">
                        {coupon.discount_type === 'PERCENTAGE' ? (
                          <Percent className="w-4 h-4 text-primary" />
                        ) : (
                          <DollarSign className="w-4 h-4 text-green-500" />
                        )}
                        <span className="text-white font-medium">
                          {coupon.discount_value}
                          {coupon.discount_type === 'PERCENTAGE' ? '%' : ' USD'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-neutral-300">
                        <p>{formatDate(coupon.start_date)}</p>
                        <p className="text-neutral-500">hasta</p>
                        <p>{formatDate(coupon.end_date)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-neutral-300">
                        <span className="font-medium text-white">{coupon.used_count}</span>
                        <span className="text-neutral-500"> / {coupon.usage_limit || '∞'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(coupon.id)}
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                          coupon.is_active
                            ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                            : 'bg-neutral-500/10 text-neutral-500 hover:bg-neutral-500/20'
                        }`}
                      >
                        {coupon.is_active ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenModal(coupon)}
                          className="p-2 hover:bg-neutral-800 rounded-lg transition-colors text-primary"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(coupon.id)}
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
          <div className="bg-[#1A1A1A] border border-neutral-800 rounded-xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-neutral-800">
              <h2 className="text-xl font-bold text-white">
                {editingCoupon ? 'Editar Cupón' : 'Nuevo Cupón'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500 rounded-lg p-3 text-sm text-red-500">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Code */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-neutral-400 mb-1">
                    Código del Cupón
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2 bg-black border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-primary font-mono uppercase"
                    placeholder="EJ: VERANO2024"
                    required
                  />
                </div>

                {/* Discount Type */}
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">
                    Tipo de Descuento
                  </label>
                  <select
                    value={formData.discount_type}
                    onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as any })}
                    className="w-full px-4 py-2 bg-black border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-primary"
                  >
                    <option value="PERCENTAGE">Porcentaje (%)</option>
                    <option value="FIXED">Monto Fijo ($)</option>
                  </select>
                </div>

                {/* Discount Value */}
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">
                    Valor del Descuento
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.discount_value}
                      onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 bg-black border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-primary pl-10"
                      min="0"
                      step="0.01"
                      required
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                      {formData.discount_type === 'PERCENTAGE' ? <Percent className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">
                    Fecha de Inicio
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-4 py-2 bg-black border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">
                    Fecha de Fin
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-4 py-2 bg-black border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-primary"
                    required
                  />
                </div>

                {/* Limits */}
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">
                    Compra Mínima ($)
                  </label>
                  <input
                    type="number"
                    value={formData.min_purchase_amount}
                    onChange={(e) => setFormData({ ...formData, min_purchase_amount: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 bg-black border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-primary"
                    min="0"
                    placeholder="Opcional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">
                    Límite de Uso (Total)
                  </label>
                  <input
                    type="number"
                    value={formData.usage_limit}
                    onChange={(e) => setFormData({ ...formData, usage_limit: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-black border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-primary"
                    min="0"
                    placeholder="0 = Ilimitado"
                  />
                </div>

                {formData.discount_type === 'PERCENTAGE' && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-neutral-400 mb-1">
                      Descuento Máximo ($)
                    </label>
                    <input
                      type="number"
                      value={formData.max_discount_amount}
                      onChange={(e) => setFormData({ ...formData, max_discount_amount: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 bg-black border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-primary"
                      min="0"
                      placeholder="Opcional"
                    />
                    <p className="text-xs text-neutral-500 mt-1">
                      Límite máximo de descuento en dinero para cupones porcentuales.
                    </p>
                  </div>
                )}

                <div className="col-span-2 flex items-center space-x-2 pt-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-5 h-5 rounded border-neutral-800 bg-black text-primary focus:ring-primary"
                  />
                  <label htmlFor="is_active" className="text-white cursor-pointer select-none">
                    Activar cupón inmediatamente
                  </label>
                </div>
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
                      <span>Guardar Cupón</span>
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

export default AdminCoupons;
