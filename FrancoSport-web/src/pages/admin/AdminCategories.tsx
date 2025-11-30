/**
 * Admin Categories Page
 * Franco Sport E-Commerce
 */

import React from 'react';
import { FolderTree, Plus } from 'lucide-react';

const AdminCategories: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white mb-2">Categorías</h1>
          <p className="text-neutral-400">Gestiona las categorías de productos</p>
        </div>
        <button className="inline-flex items-center space-x-2 px-4 py-2 bg-primary text-black font-semibold rounded-lg hover:bg-primary/90">
          <Plus className="w-5 h-5" />
          <span>Nueva Categoría</span>
        </button>
      </div>

      <div className="bg-[#1A1A1A] border border-neutral-800 rounded-xl p-12 text-center">
        <FolderTree className="w-16 h-16 text-neutral-700 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-white mb-2">Próximamente</h3>
        <p className="text-neutral-400">
          La gestión de categorías estará disponible próximamente
        </p>
      </div>
    </div>
  );
};

export default AdminCategories;
