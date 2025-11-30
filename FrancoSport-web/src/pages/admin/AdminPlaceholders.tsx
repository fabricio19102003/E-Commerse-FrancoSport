/**
 * Admin Brands, Coupons, Shipping, Reviews, Settings Pages
 * Franco Sport E-Commerce
 */

import React from 'react';
import { Tag, Plus } from 'lucide-react';

export const AdminBrands: React.FC = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-black text-white mb-2">Marcas</h1>
        <p className="text-neutral-400">Gestiona las marcas de productos</p>
      </div>
      <button className="inline-flex items-center space-x-2 px-4 py-2 bg-primary text-black font-semibold rounded-lg hover:bg-primary/90">
        <Plus className="w-5 h-5" />
        <span>Nueva Marca</span>
      </button>
    </div>
    <div className="bg-[#1A1A1A] border border-neutral-800 rounded-xl p-12 text-center">
      <Tag className="w-16 h-16 text-neutral-700 mx-auto mb-4" />
      <h3 className="text-lg font-bold text-white mb-2">Próximamente</h3>
      <p className="text-neutral-400">La gestión de marcas estará disponible próximamente</p>
    </div>
  </div>
);

export const AdminCoupons: React.FC = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-black text-white mb-2">Cupones</h1>
        <p className="text-neutral-400">Gestiona cupones y descuentos</p>
      </div>
      <button className="inline-flex items-center space-x-2 px-4 py-2 bg-primary text-black font-semibold rounded-lg hover:bg-primary/90">
        <Plus className="w-5 h-5" />
        <span>Nuevo Cupón</span>
      </button>
    </div>
    <div className="bg-[#1A1A1A] border border-neutral-800 rounded-xl p-12 text-center">
      <Tag className="w-16 h-16 text-neutral-700 mx-auto mb-4" />
      <h3 className="text-lg font-bold text-white mb-2">Próximamente</h3>
      <p className="text-neutral-400">La gestión de cupones estará disponible próximamente</p>
    </div>
  </div>
);

export const AdminShipping: React.FC = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-3xl font-black text-white mb-2">Métodos de Envío</h1>
      <p className="text-neutral-400">Configura zonas y métodos de envío</p>
    </div>
    <div className="bg-[#1A1A1A] border border-neutral-800 rounded-xl p-12 text-center">
      <Tag className="w-16 h-16 text-neutral-700 mx-auto mb-4" />
      <h3 className="text-lg font-bold text-white mb-2">Próximamente</h3>
      <p className="text-neutral-400">La configuración de envíos estará disponible próximamente</p>
    </div>
  </div>
);

export const AdminReviews: React.FC = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-3xl font-black text-white mb-2">Reseñas</h1>
      <p className="text-neutral-400">Modera las reseñas de productos</p>
    </div>
    <div className="bg-[#1A1A1A] border border-neutral-800 rounded-xl p-12 text-center">
      <Tag className="w-16 h-16 text-neutral-700 mx-auto mb-4" />
      <h3 className="text-lg font-bold text-white mb-2">Próximamente</h3>
      <p className="text-neutral-400">La moderación de reseñas estará disponible próximamente</p>
    </div>
  </div>
);

export const AdminSettings: React.FC = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-3xl font-black text-white mb-2">Configuración</h1>
      <p className="text-neutral-400">Configura los ajustes generales del sistema</p>
    </div>
    <div className="bg-[#1A1A1A] border border-neutral-800 rounded-xl p-12 text-center">
      <Tag className="w-16 h-16 text-neutral-700 mx-auto mb-4" />
      <h3 className="text-lg font-bold text-white mb-2">Próximamente</h3>
      <p className="text-neutral-400">La configuración del sistema estará disponible próximamente</p>
    </div>
  </div>
);
