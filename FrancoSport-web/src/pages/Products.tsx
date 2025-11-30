import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Container } from '@/components/layout/Container';
import { Card, Badge, Button } from '@/components/ui';
import { Filter, Grid, List, Loader2, ShoppingCart, Search, X, ChevronDown, ChevronUp } from 'lucide-react';
import { getProducts, getCategories, getBrands } from '@/api/products.service';
import type { Product, Category, Brand } from '@/types';
import { generateRoute } from '@/constants/routes';

const Products: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalProducts, setTotalProducts] = useState(0);

  // UI State
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter State
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(
    searchParams.get('category') ? parseInt(searchParams.get('category')!) : null
  );
  const [selectedBrand, setSelectedBrand] = useState<number | null>(
    searchParams.get('brand') ? parseInt(searchParams.get('brand')!) : null
  );
  const [priceRange, setPriceRange] = useState<{ min: string; max: string }>({
    min: searchParams.get('min_price') || '',
    max: searchParams.get('max_price') || ''
  });

  // Initial Load
  useEffect(() => {
    const loadData = async () => {
      try {
        const [cats, brnds] = await Promise.all([getCategories(), getBrands()]);
        setCategories(cats);
        setBrands(brnds);
      } catch (err) {
        console.error('Error loading filters data:', err);
      }
    };
    loadData();
  }, []);

  // Fetch Products when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
      updateUrlParams();
    }, 500); // Debounce search

    return () => clearTimeout(timer);
  }, [searchTerm, selectedCategory, selectedBrand, priceRange]);

  const updateUrlParams = () => {
    const params: any = {};
    if (searchTerm) params.search = searchTerm;
    if (selectedCategory) params.category = selectedCategory.toString();
    if (selectedBrand) params.brand = selectedBrand.toString();
    if (priceRange.min) params.min_price = priceRange.min;
    if (priceRange.max) params.max_price = priceRange.max;
    setSearchParams(params);
  };

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const filters: any = {};
      if (searchTerm) filters.search = searchTerm;
      if (selectedCategory) filters.category_id = selectedCategory;
      if (selectedBrand) filters.brand_id = selectedBrand;
      if (priceRange.min) filters.min_price = parseFloat(priceRange.min);
      if (priceRange.max) filters.max_price = parseFloat(priceRange.max);

      const response = await getProducts(filters);
      setProducts(response.data);
      setTotalProducts(response.pagination.total);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Error al cargar los productos.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory(null);
    setSelectedBrand(null);
    setPriceRange({ min: '', max: '' });
  };

  return (
    <div className="py-8">
      <Container>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Todos los Productos</h1>
          <p className="text-text-secondary">
            Explora nuestra colección completa de ropa deportiva
          </p>
        </div>

        {/* Controls Bar */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8 p-4 bg-surface rounded-lg shadow-sm border border-border">
          {/* Left: Search & Filter Toggle */}
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              />
            </div>
            
            <Button 
              variant={showFilters ? "primary" : "outline"} 
              size="sm" 
              onClick={() => setShowFilters(!showFilters)}
              leftIcon={<Filter className="w-4 h-4" />}
            >
              Filtros
            </Button>
          </div>

          {/* Right: View Mode & Count */}
          <div className="flex items-center justify-between w-full lg:w-auto gap-4">
            <Badge variant="default">{totalProducts} resultados</Badge>
            
            <div className="flex items-center border border-border rounded-md overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-primary/10 text-primary' : 'bg-surface text-text-tertiary hover:bg-background'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <div className="w-px h-8 bg-border" />
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-primary/10 text-primary' : 'bg-surface text-text-tertiary hover:bg-background'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="w-full lg:w-64 flex-shrink-0 space-y-6 animate-in slide-in-from-top-4 duration-200">
              <div className="bg-surface p-6 rounded-lg border border-border shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg">Filtros</h3>
                  <button onClick={clearFilters} className="text-xs text-primary hover:underline">
                    Limpiar todo
                  </button>
                </div>

                {/* Categories */}
                <div className="mb-6">
                  <h4 className="font-medium mb-3 text-sm text-text-secondary">Categorías</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {categories.map((category) => (
                      <label key={category.id} className="flex items-center space-x-2 cursor-pointer group">
                        <input
                          type="radio"
                          name="category"
                          checked={selectedCategory === category.id}
                          onChange={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
                          onClick={(e) => {
                            if (selectedCategory === category.id) {
                              e.preventDefault();
                              setSelectedCategory(null);
                            }
                          }}
                          className="rounded border-border text-primary focus:ring-primary"
                        />
                        <span className={`text-sm group-hover:text-primary transition-colors ${selectedCategory === category.id ? 'text-primary font-medium' : 'text-text-secondary'}`}>
                          {category.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Brands */}
                <div className="mb-6">
                  <h4 className="font-medium mb-3 text-sm text-text-secondary">Marcas</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {brands.map((brand) => (
                      <label key={brand.id} className="flex items-center space-x-2 cursor-pointer group">
                        <input
                          type="radio"
                          name="brand"
                          checked={selectedBrand === brand.id}
                          onChange={() => setSelectedBrand(selectedBrand === brand.id ? null : brand.id)}
                          onClick={(e) => {
                            if (selectedBrand === brand.id) {
                              e.preventDefault();
                              setSelectedBrand(null);
                            }
                          }}
                          className="rounded border-border text-primary focus:ring-primary"
                        />
                        <span className={`text-sm group-hover:text-primary transition-colors ${selectedBrand === brand.id ? 'text-primary font-medium' : 'text-text-secondary'}`}>
                          {brand.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <h4 className="font-medium mb-3 text-sm text-text-secondary">Precio</h4>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <span className="text-text-tertiary">-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Products Grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="py-20 flex justify-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
            ) : products.length > 0 ? (
              <div className={`grid gap-6 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                  : 'grid-cols-1'
              }`}>
                {products.map((product) => (
                  <Card key={product.id} hoverable className={`flex ${viewMode === 'list' ? 'flex-row' : 'flex-col'} h-full overflow-hidden group`}>
                    <Link 
                      to={generateRoute.productDetail(product.slug)} 
                      className={`block relative overflow-hidden ${viewMode === 'list' ? 'w-48 shrink-0' : 'aspect-square'}`}
                    >
                      <img
                        src={product.images[0]?.url || '/placeholder.png'}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.png';
                        }}
                      />
                      {product.stock <= 0 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="text-white font-bold px-3 py-1 border-2 border-white rounded-md transform -rotate-12">
                            AGOTADO
                          </span>
                        </div>
                      )}
                    </Link>
                    
                    <div className="p-4 flex-1 flex flex-col">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="space-y-1">
                          {product.category && (
                            <span className="text-xs text-text-tertiary uppercase tracking-wider">
                              {product.category.name}
                            </span>
                          )}
                          <Link to={generateRoute.productDetail(product.slug)} className="block hover:text-primary transition-colors">
                            <h3 className="font-bold text-lg leading-tight">{product.name}</h3>
                          </Link>
                        </div>
                        {product.is_featured && (
                          <Badge variant="primary" size="sm" className="shrink-0">Destacado</Badge>
                        )}
                      </div>
                      
                      <p className="text-text-secondary text-sm line-clamp-2 mb-4 flex-1">
                        {product.short_description || product.description.substring(0, 100)}...
                      </p>
                      
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-border">
                        <div className="flex flex-col">
                          <span className="text-2xl font-bold text-primary">
                            ${parseFloat(product.price.toString()).toFixed(2)}
                          </span>
                          {product.compare_at_price && parseFloat(product.compare_at_price.toString()) > parseFloat(product.price.toString()) && (
                            <span className="text-sm text-text-tertiary line-through">
                              ${parseFloat(product.compare_at_price.toString()).toFixed(2)}
                            </span>
                          )}
                        </div>
                        <Button 
                          size="sm" 
                          disabled={product.stock <= 0}
                          leftIcon={<ShoppingCart className="w-4 h-4" />}
                          className={product.stock <= 0 ? 'opacity-50 cursor-not-allowed' : ''}
                        >
                          {product.stock <= 0 ? 'Agotado' : 'Agregar'}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-surface rounded-xl border border-border border-dashed">
                <Search className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
                <h3 className="text-lg font-bold text-text-primary mb-2">No se encontraron productos</h3>
                <p className="text-text-secondary mb-6 max-w-md mx-auto">
                  No hay productos que coincidan con tu búsqueda. Intenta ajustar los filtros o buscar con otros términos.
                </p>
                <Button variant="outline" onClick={clearFilters}>
                  Limpiar filtros
                </Button>
              </div>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
};

export default Products;
