import { formatCurrency } from '@/utils/currency';

import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Container } from '@/components/layout/Container';
import { Card, Badge, Button } from '@/components/ui';
import { Grid, List, ShoppingCart, Search, SlidersHorizontal } from 'lucide-react';
import { getProducts, getCategories, getBrands } from '@/api/products.service';
import type { Product, Category, Brand } from '@/types';
import { generateRoute } from '@/constants/routes';
import { useCartStore } from '@/store';
import toast from 'react-hot-toast';

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
  const [activeImageIndex, setActiveImageIndex] = useState<Record<number, number>>({});

  // Filter State
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
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

  // Handle URL params for category and brand (slug or id)
  useEffect(() => {
    // Category Logic
    const categoryParam = searchParams.get('category');
    if (categoryParam && categories.length > 0) {
      const categoryBySlug = categories.find(c => c.slug === categoryParam);
      if (categoryBySlug) {
        setSelectedCategory(categoryBySlug.id);
      } else {
        const categoryId = parseInt(categoryParam);
        if (!isNaN(categoryId)) setSelectedCategory(categoryId);
      }
    } else if (!categoryParam) {
      setSelectedCategory(null);
    }

    // Brand Logic
    const brandParam = searchParams.get('brand');
    if (brandParam && brands.length > 0) {
      const brandBySlug = brands.find(b => b.slug === brandParam);
      if (brandBySlug) {
        setSelectedBrand(brandBySlug.id);
      } else {
        const brandId = parseInt(brandParam);
        if (!isNaN(brandId)) setSelectedBrand(brandId);
      }
    } else if (!brandParam) {
      setSelectedBrand(null);
    }
  }, [searchParams, categories, brands]);

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
    
    if (selectedCategory) {
      const category = categories.find(c => c.id === selectedCategory);
      if (category) {
        params.category = category.slug;
      } else {
        params.category = selectedCategory.toString();
      }
    }
    
    if (selectedBrand) {
      const brand = brands.find(b => b.id === selectedBrand);
      if (brand) {
        params.brand = brand.slug;
      } else {
        params.brand = selectedBrand.toString();
      }
    }
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

  const handleMouseEnter = (productId: number, imagesLength: number) => {
    if (imagesLength > 1) {
      setActiveImageIndex(prev => ({ ...prev, [productId]: 1 }));
    }
  };

  const handleMouseLeave = (productId: number) => {
    setActiveImageIndex(prev => ({ ...prev, [productId]: 0 }));
  };

  const { addItem } = useCartStore();

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock <= 0) return;
    
    addItem(product, undefined, 1);
    toast.success(`${product.name} agregado al carrito`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative h-[40vh] min-h-[400px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent z-10" />
        <img 
          src="https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=2070&auto=format&fit=crop" 
          alt="Sports Collection" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <Container className="relative z-20 h-full flex flex-col justify-center">
          <div className="max-w-2xl animate-in slide-in-from-left duration-700 fade-in">
            <Badge variant="primary" className="mb-4">Nueva Colección 2025</Badge>
            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">
              SUPERA TUS <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/50">LÍMITES</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-lg">
              Equipamiento profesional diseñado para atletas que buscan la excelencia en cada movimiento.
            </p>
          </div>
        </Container>
      </div>

      <Container className="py-12">
        {/* Controls Bar */}
        <div className="sticky top-20 z-30 bg-background/80 backdrop-blur-md border-b border-border mb-8 -mx-4 px-4 py-4 md:rounded-xl md:border md:mx-0 transition-all duration-300">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            {/* Left: Search & Filter Toggle */}
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              <div className="relative w-full sm:w-80 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
              </div>
              
              <Button 
                variant={showFilters ? "primary" : "outline"} 
                onClick={() => setShowFilters(!showFilters)}
                leftIcon={<SlidersHorizontal className="w-4 h-4" />}
                className="whitespace-nowrap"
              >
                Filtros {showFilters ? 'Activos' : ''}
              </Button>
            </div>

            {/* Right: View Mode & Count */}
            <div className="flex items-center justify-between w-full lg:w-auto gap-6">
              <span className="text-sm text-text-secondary font-medium">
                Mostrando <span className="text-white font-bold">{products.length}</span> de {totalProducts} productos
              </span>
              
              <div className="flex items-center bg-surface border border-border rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-primary text-black shadow-lg' : 'text-text-tertiary hover:text-white'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-primary text-black shadow-lg' : 'text-text-tertiary hover:text-white'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-border animate-in slide-in-from-top-2 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Categories */}
                <div>
                  <h4 className="font-bold mb-4 text-white flex items-center gap-2">
                    Categorías
                    {selectedCategory && <Badge variant="primary" size="sm" className="ml-auto text-[10px]">1</Badge>}
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                    {categories.map((category) => (
                      <label key={category.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-surface cursor-pointer group transition-colors">
                        <span className={`text-sm ${selectedCategory === category.id ? 'text-primary font-bold' : 'text-text-secondary group-hover:text-white'}`}>
                          {category.name}
                        </span>
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedCategory === category.id ? 'bg-primary border-primary' : 'border-neutral-600 group-hover:border-primary'}`}>
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
                            className="hidden"
                          />
                          {selectedCategory === category.id && <div className="w-2 h-2 bg-black rounded-full" />}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Brands */}
                <div>
                  <h4 className="font-bold mb-4 text-white flex items-center gap-2">
                    Marcas
                    {selectedBrand && <Badge variant="primary" size="sm" className="ml-auto text-[10px]">1</Badge>}
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                    {brands.map((brand) => (
                      <label key={brand.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-surface cursor-pointer group transition-colors">
                        <span className={`text-sm ${selectedBrand === brand.id ? 'text-primary font-bold' : 'text-text-secondary group-hover:text-white'}`}>
                          {brand.name}
                        </span>
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedBrand === brand.id ? 'bg-primary border-primary' : 'border-neutral-600 group-hover:border-primary'}`}>
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
                            className="hidden"
                          />
                          {selectedBrand === brand.id && <div className="w-2 h-2 bg-black rounded-full" />}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <h4 className="font-bold mb-4 text-white">Precio</h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">Bs.</span>
                        <input
                          type="number"
                          placeholder="Min"
                          value={priceRange.min}
                          onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                          className="w-full pl-7 pr-3 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
                        />
                      </div>
                      <span className="text-text-tertiary">-</span>
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">Bs.</span>
                        <input
                          type="number"
                          placeholder="Max"
                          value={priceRange.max}
                          onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                          className="w-full pl-7 pr-3 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col justify-end">
                  <Button variant="outline" onClick={clearFilters} className="w-full hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50">
                    Limpiar Filtros
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Products Grid */}
        <div className="min-h-[400px]">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-surface rounded-xl h-[400px] animate-pulse border border-border" />
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className={`grid gap-6 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                : 'grid-cols-1'
            }`}>
              {products.map((product, index) => (
                <div 
                  key={product.id}
                  className={`group relative bg-surface rounded-xl border border-border overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 ${
                    viewMode === 'list' ? 'flex' : 'flex-col'
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                  onMouseEnter={() => handleMouseEnter(product.id, product.images.length)}
                  onMouseLeave={() => handleMouseLeave(product.id)}
                >
                  {/* Image Container */}
                  <div className={`relative overflow-hidden ${viewMode === 'list' ? 'w-64 shrink-0' : 'aspect-[4/5]'}`}>
                    <Link to={generateRoute.productDetail(product.slug)} className="block w-full h-full">
                      {product.images.slice(0, 2).map((img, i) => (
                        <img
                          key={img.id}
                          src={img.url || '/placeholder.png'}
                          alt={product.name}
                          className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 transform ${
                            (activeImageIndex[product.id] || 0) === i 
                              ? 'opacity-100 scale-110' 
                              : 'opacity-0 scale-100'
                          } ${i === 0 && !(activeImageIndex[product.id]) ? 'opacity-100' : ''} ${
                            // Fix: Ensure the first image stays visible if the second one is active but we want a smooth transition or fallback
                            // Actually, the logic above hides the first image when index is 1. 
                            // If we want to keep the first image visible as a background, we can remove opacity-0 from it when i===0.
                            // But for now, let's just rely on the check in handleMouseEnter.
                            ''
                          }`}
                        />
                      ))}
                    </Link>
                    
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
                      {product.is_featured && (
                        <Badge variant="primary" size="sm" className="shadow-lg">Destacado</Badge>
                      )}
                      {product.stock <= 0 && (
                        <Badge variant="danger" size="sm" className="shadow-lg">Agotado</Badge>
                      )}
                      {product.compare_at_price && parseFloat(product.compare_at_price.toString()) > parseFloat(product.price.toString()) && (
                        <Badge variant="success" size="sm" className="shadow-lg bg-green-500 text-white border-none">
                          -{Math.round(((parseFloat(product.compare_at_price.toString()) - parseFloat(product.price.toString())) / parseFloat(product.compare_at_price.toString())) * 100)}%
                        </Badge>
                      )}
                    </div>

                    {/* Quick Actions Overlay */}
                    <div className={`absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-black/90 to-transparent ${viewMode === 'list' ? 'hidden' : ''}`}>
                      <Button 
                        className="w-full shadow-lg font-bold" 
                        size="sm"
                        onClick={(e) => handleAddToCart(e, product)}
                        disabled={product.stock <= 0}
                      >
                        {product.stock <= 0 ? 'Ver Detalles' : 'Agregar al Carrito'}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-5 flex flex-col flex-1">
                    <div className="mb-2">
                      {product.category && (
                        <span className="text-xs font-bold text-primary uppercase tracking-wider mb-1 block">
                          {product.category.name}
                        </span>
                      )}
                      <Link to={generateRoute.productDetail(product.slug)} className="block group-hover:text-primary transition-colors">
                        <h3 className="font-bold text-lg leading-tight line-clamp-2">{product.name}</h3>
                      </Link>
                    </div>
                    
                    <p className="text-text-secondary text-sm line-clamp-2 mb-4 flex-1">
                      {product.short_description || product.description.substring(0, 100)}...
                    </p>
                    
                    <div className="flex items-end justify-between mt-auto pt-4 border-t border-border/50">
                      <div className="flex flex-col">
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-black text-white">
                            {formatCurrency(Number(product.price))}
                          </span>
                          {product.compare_at_price && parseFloat(product.compare_at_price.toString()) > parseFloat(product.price.toString()) && (
                            <span className="text-sm text-text-tertiary line-through font-medium">
                              {formatCurrency(Number(product.compare_at_price))}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {viewMode === 'list' && (
                        <Button 
                          size="sm" 
                          disabled={product.stock <= 0}
                          leftIcon={<ShoppingCart className="w-4 h-4" />}
                          onClick={(e) => handleAddToCart(e, product)}
                        >
                          {product.stock <= 0 ? 'Agotado' : 'Agregar'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-surface/50 rounded-3xl border border-border border-dashed">
              <div className="w-20 h-20 bg-background rounded-full flex items-center justify-center mb-6 shadow-xl border border-border">
                <Search className="w-10 h-10 text-text-tertiary" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">No se encontraron productos</h3>
              <p className="text-text-secondary mb-8 max-w-md text-center">
                No hay productos que coincidan con tu búsqueda. Intenta ajustar los filtros o buscar con otros términos.
              </p>
              <Button variant="outline" onClick={clearFilters} size="lg">
                Limpiar todos los filtros
              </Button>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
};

export default Products;
