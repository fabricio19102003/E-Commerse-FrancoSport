/**
 * Admin Products Page
 * Franco Sport E-Commerce
 * 
 * Gestión completa de productos (CRUD) - CONECTADO CON API
 */

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { adminProductsService } from '@/api/admin';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  AlertTriangle,
  Package,
  DollarSign,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import type { Product } from '@/types';

import { useConfirm } from '@/hooks/useConfirm';

const AdminProducts: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const { confirm } = useConfirm();

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const filters: any = {};
      if (searchTerm) filters.search = searchTerm;
      if (selectedCategory) filters.category_id = selectedCategory;
      if (selectedBrand) filters.brand_id = selectedBrand;

      const response = await adminProductsService.getProducts(filters);
      setProducts(response.data);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError(err.response?.data?.error?.message || 'Error al cargar productos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [searchTerm, selectedCategory, selectedBrand]);

  // Handle delete product
  const handleDelete = async (productId: number) => {
    const isConfirmed = await confirm({
      title: 'Eliminar Producto',
      message: '¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      variant: 'danger'
    });

    if (!isConfirmed) return;

    try {
      await adminProductsService.deleteProduct(productId);
      alert('Producto eliminado exitosamente');
      fetchProducts(); // Refresh list
    } catch (err: any) {
      console.error('Error deleting product:', err);
      alert(err.response?.data?.error?.message || 'Error al eliminar producto');
    }
  };

  // Handle toggle status
  const handleToggleStatus = async (productId: number) => {
    try {
      await adminProductsService.toggleProductStatus(productId);
      fetchProducts(); // Refresh list
    } catch (err: any) {
      console.error('Error toggling status:', err);
      alert(err.response?.data?.error?.message || 'Error al cambiar estado');
    }
  };

  const getStockBadge = (stock: number, lowStockThreshold: number) => {
    if (stock === 0) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500">
          Agotado
        </span>
      );
    }
    if (stock <= lowStockThreshold) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-500">
          Stock Bajo
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
        En Stock
      </span>
    );
  };

  // Calculate stats
  const stats = {
    total: products.length,
    lowStock: products.filter(p => p.stock > 0 && p.stock <= p.low_stock_threshold).length,
    outOfStock: products.filter(p => p.stock === 0).length,
    featured: products.filter(p => p.is_featured).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white mb-2">Productos</h1>
          <p className="text-neutral-400">
            Gestiona tu catálogo de productos
          </p>
        </div>
        <Link
          to={ROUTES.ADMIN_PRODUCT_CREATE}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-primary text-black font-semibold rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Nuevo Producto</span>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#1A1A1A] border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-3">
            <Package className="w-5 h-5 text-primary" />
            <h4 className="text-sm font-medium text-neutral-400">Total Productos</h4>
          </div>
          <p className="text-2xl font-black text-white">{stats.total}</p>
        </div>

        <div className="bg-[#1A1A1A] border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <h4 className="text-sm font-medium text-neutral-400">Stock Bajo</h4>
          </div>
          <p className="text-2xl font-black text-white">{stats.lowStock}</p>
        </div>

        <div className="bg-[#1A1A1A] border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-3">
            <Trash2 className="w-5 h-5 text-red-500" />
            <h4 className="text-sm font-medium text-neutral-400">Agotados</h4>
          </div>
          <p className="text-2xl font-black text-white">{stats.outOfStock}</p>
        </div>

        <div className="bg-[#1A1A1A] border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-3">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <h4 className="text-sm font-medium text-neutral-400">Destacados</h4>
          </div>
          <p className="text-2xl font-black text-white">{stats.featured}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#1A1A1A] border border-neutral-800 rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por nombre o SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-black border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-primary"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 bg-black border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-primary"
          >
            <option value="">Todas las categorías</option>
            <option value="1">Elite</option>
            <option value="2">Pro</option>
            <option value="3">Sport</option>
          </select>

          {/* Brand Filter */}
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="px-4 py-2 bg-black border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-primary"
          >
            <option value="">Todas las marcas</option>
            <option value="1">Franco Sport</option>
            <option value="2">Racing Elite</option>
            <option value="3">Legacy</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500 rounded-xl p-4">
          <p className="text-red-500 font-medium">{error}</p>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-[#1A1A1A] border border-neutral-800 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 text-primary mx-auto mb-4 animate-spin" />
            <p className="text-neutral-400">Cargando productos...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-16 h-16 text-neutral-700 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No hay productos</h3>
            <p className="text-neutral-400 mb-6">
              {searchTerm || selectedCategory || selectedBrand
                ? 'No se encontraron productos con los filtros seleccionados'
                : 'Comienza agregando tu primer producto'}
            </p>
            {!searchTerm && !selectedCategory && !selectedBrand && (
              <Link
                to={ROUTES.ADMIN_PRODUCT_CREATE}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-primary text-black font-semibold rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Crear Producto</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black">
                <tr>
                  <th className="text-left text-sm font-medium text-neutral-400 px-6 py-4">
                    Producto
                  </th>
                  <th className="text-left text-sm font-medium text-neutral-400 px-6 py-4">
                    SKU
                  </th>
                  <th className="text-left text-sm font-medium text-neutral-400 px-6 py-4">
                    Precio
                  </th>
                  <th className="text-left text-sm font-medium text-neutral-400 px-6 py-4">
                    Stock
                  </th>
                  <th className="text-left text-sm font-medium text-neutral-400 px-6 py-4">
                    Estado
                  </th>
                  <th className="text-right text-sm font-medium text-neutral-400 px-6 py-4">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-t border-neutral-800 hover:bg-neutral-900/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-4">
                        <img
                          src={product.images?.[0]?.url || '/placeholder.png'}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded-lg"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder.png';
                          }}
                        />
                        <div>
                          <p className="font-medium text-white">{product.name}</p>
                          <p className="text-sm text-neutral-400">{product.category?.name || 'Sin categoría'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-neutral-300 font-mono">{product.sku}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-white">${parseFloat(product.price.toString()).toFixed(2)}</p>
                        {product.compare_at_price && parseFloat(product.compare_at_price.toString()) > parseFloat(product.price.toString()) && (
                          <p className="text-sm text-neutral-500 line-through">
                            ${parseFloat(product.compare_at_price.toString()).toFixed(2)}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-white">{product.stock} unidades</p>
                        {getStockBadge(product.stock, product.low_stock_threshold)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(product.id)}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-colors hover:opacity-80"
                        style={{
                          backgroundColor: product.is_active ? 'rgba(34, 197, 94, 0.1)' : 'rgba(115, 115, 115, 0.1)',
                          color: product.is_active ? '#22c55e' : '#737373',
                        }}
                      >
                        {product.is_active ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          to={`/producto/${product.slug}`}
                          target="_blank"
                          className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
                          title="Ver en tienda"
                        >
                          <Eye className="w-4 h-4 text-neutral-400" />
                        </Link>
                        <Link
                          to={`${ROUTES.ADMIN_PRODUCTS}/editar/${product.id}`}
                          className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4 text-primary" />
                        </Link>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
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
    </div>
  );
};

export default AdminProducts;
