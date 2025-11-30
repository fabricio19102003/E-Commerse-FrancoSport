import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Container } from '@/components/layout/Container';
import { Button, Badge, Card } from '@/components/ui';
import { 
  ShoppingCart, 
  Heart, 
  Star, 
  Truck, 
  ShieldCheck, 
  ArrowLeft, 
  Minus, 
  Plus, 
  Share2
} from 'lucide-react';
import { getProductBySlug, getProductReviews, createProductReview } from '@/api/products.service';
import { useCartStore, useWishlistStore, useAuthStore } from '@/store';
import type { Product, Review, CreateReviewInput } from '@/types';
import { ROUTES } from '@/constants/routes';
import toast from 'react-hot-toast';

const ProductDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  
  // Stores
  const { addItem: addToCart } = useCartStore();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore();
  const { isAuthenticated, user } = useAuthStore();

  // State
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  
  // Review Form State
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    const loadProduct = async () => {
      if (!slug) return;
      
      try {
        setIsLoading(true);
        const data = await getProductBySlug(slug);
        setProduct(data);
        setSelectedImage(data.images[0]?.url || '/placeholder.png');
        setIsWishlisted(isInWishlist(data.id));
        
        // Load reviews
        try {
          const reviewsData = await getProductReviews(data.id);
          setReviews(reviewsData);
        } catch (err: any) {
          if (err.response && err.response.status === 404) {
            setReviews([]);
          } else {
            console.error('Error loading reviews:', err);
          }
        }
      } catch (error) {
        console.error('Error loading product:', error);
        toast.error('Error al cargar el producto');
        navigate(ROUTES.PRODUCTS);
      } finally {
        setIsLoading(false);
      }
    };

    loadProduct();
  }, [slug, isInWishlist, navigate]);

  const handleQuantityChange = (value: number) => {
    if (value < 1) return;
    if (product && value > Number(product.stock)) return;
    setQuantity(value);
  };

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, undefined, quantity);
    toast.success('Producto agregado al carrito');
  };

  const handleToggleWishlist = () => {
    if (!product) return;
    
    if (isWishlisted) {
      removeFromWishlist(product.id);
      setIsWishlisted(false);
      toast.success('Eliminado de favoritos');
    } else {
      addToWishlist(product);
      setIsWishlisted(true);
      toast.success('Agregado a favoritos');
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Enlace copiado al portapapeles');
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    if (!isAuthenticated) {
      toast.error('Debes iniciar sesión para dejar una reseña');
      navigate(ROUTES.LOGIN);
      return;
    }

    try {
      setIsSubmittingReview(true);
      const newReview: CreateReviewInput = {
        product_id: product.id,
        rating: reviewRating,
        comment: reviewComment,
        title: 'Reseña de usuario'
      };

      await createProductReview(newReview);
      toast.success('Reseña enviada correctamente');
      setShowReviewForm(false);
      setReviewComment('');
      setReviewRating(5);
      
      // Reload reviews
      try {
        const reviewsData = await getProductReviews(product.id);
        setReviews(reviewsData);
      } catch (error) {
        console.error('Error reloading reviews:', error);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Error al enviar la reseña');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="bg-background min-h-screen py-8">
      <Container>
        {/* Breadcrumb & Back */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <button onClick={() => navigate(-1)} className="hover:text-primary mr-2">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <Link to={ROUTES.HOME} className="hover:text-primary">Inicio</Link>
            <span>/</span>
            <Link to={ROUTES.PRODUCTS} className="hover:text-primary">Productos</Link>
            <span>/</span>
            <span className="text-text-primary font-medium truncate max-w-[200px]">{product.name}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Gallery */}
          <div className="space-y-4">
            <div className="aspect-square bg-surface rounded-xl overflow-hidden border border-border relative group">
              <img 
                src={selectedImage} 
                alt={product.name}
                className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
              />
              {Number(product.stock) <= 0 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white font-bold text-2xl px-6 py-2 border-4 border-white rounded-lg transform -rotate-12">
                    AGOTADO
                  </span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-5 gap-4">
              {product.images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(img.url)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === img.url ? 'border-primary' : 'border-transparent hover:border-border'
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <div className="mb-2">
              {product.brand && (
                <Link to={`${ROUTES.PRODUCTS}?brand=${product.brand.id}`} className="text-primary font-bold uppercase tracking-wider text-sm hover:underline">
                  {product.brand.name}
                </Link>
              )}
              <h1 className="text-3xl md:text-4xl font-black text-text-primary mt-1 mb-2">{product.name}</h1>
              
              {/* Rating Summary */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex text-yellow-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      className={`w-4 h-4 ${star <= (product.avg_rating || 0) ? 'fill-current' : 'text-gray-300'}`} 
                    />
                  ))}
                </div>
                <span className="text-sm text-text-secondary">
                  ({reviews.length} reseñas)
                </span>
              </div>
            </div>

            <div className="flex items-end gap-4 mb-6">
              <span className="text-4xl font-bold text-primary">
                ${Number(product.price).toFixed(2)}
              </span>
              {product.compare_at_price && product.compare_at_price > product.price && (
                <span className="text-xl text-text-tertiary line-through mb-1">
                  ${Number(product.compare_at_price).toFixed(2)}
                </span>
              )}
              {product.compare_at_price && product.compare_at_price > product.price && (
                <Badge variant="danger" className="mb-2">
                  -{Math.round(((Number(product.compare_at_price) - Number(product.price)) / Number(product.compare_at_price)) * 100)}%
                </Badge>
              )}
            </div>

            <div className="prose prose-invert text-text-secondary mb-8 max-w-none">
              <p>{product.description}</p>
            </div>

            {/* Actions */}
            <div className="space-y-6 border-t border-border pt-6 mt-auto">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Quantity */}
                <div className="flex items-center border border-border rounded-lg bg-surface w-fit">
                  <button 
                    onClick={() => handleQuantityChange(quantity - 1)}
                    className="p-3 hover:text-primary transition-colors disabled:opacity-50"
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-bold">{quantity}</span>
                  <button 
                    onClick={() => handleQuantityChange(quantity + 1)}
                    className="p-3 hover:text-primary transition-colors disabled:opacity-50"
                    disabled={quantity >= Number(product.stock)}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Add to Cart */}
                <Button 
                  size="lg" 
                  className="flex-1 text-base"
                  onClick={handleAddToCart}
                  disabled={Number(product.stock) <= 0}
                  leftIcon={<ShoppingCart className="w-5 h-5" />}
                >
                  {Number(product.stock) > 0 ? 'Agregar al Carrito' : 'Agotado'}
                </Button>

                {/* Wishlist */}
                <button 
                  onClick={handleToggleWishlist}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    isWishlisted 
                      ? 'border-red-500 text-red-500 bg-red-500/10' 
                      : 'border-border text-text-secondary hover:border-primary hover:text-primary'
                  }`}
                  title={isWishlisted ? "Eliminar de favoritos" : "Agregar a favoritos"}
                >
                  <Heart className={`w-6 h-6 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>

                {/* Share */}
                <button 
                  onClick={handleShare}
                  className="p-3 rounded-lg border-2 border-border text-text-secondary hover:border-primary hover:text-primary transition-all"
                  title="Compartir"
                >
                  <Share2 className="w-6 h-6" />
                </button>
              </div>

              {/* Features */}
              <div className="grid grid-cols-2 gap-4 text-sm text-text-secondary">
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-primary" />
                  <span>Envío gratis &gt; $1000</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  <span>Garantía de 30 días</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="border-t border-border pt-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">Reseñas de Clientes</h2>
            <Button variant="outline" onClick={() => setShowReviewForm(!showReviewForm)}>
              {showReviewForm ? 'Cancelar' : 'Escribir Reseña'}
            </Button>
          </div>

          {showReviewForm && (
            <Card className="mb-8 p-6 animate-in slide-in-from-top-4">
              <h3 className="text-lg font-bold mb-4">Escribe tu reseña</h3>
              {user && (
                <p className="text-sm text-text-secondary mb-4">
                  Comentando como <span className="font-bold text-primary">{user.first_name} {user.last_name}</span>
                </p>
              )}
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Calificación</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="focus:outline-none transition-transform hover:scale-110"
                      >
                        <Star 
                          className={`w-8 h-8 ${star <= reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Comentario</label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full bg-background border border-border rounded-md p-3 focus:ring-2 focus:ring-primary focus:outline-none min-h-[100px]"
                    placeholder="Cuéntanos qué te pareció el producto..."
                    required
                  />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" isLoading={isSubmittingReview}>
                    Publicar Reseña
                  </Button>
                </div>
              </form>
            </Card>
          )}

          <div className="space-y-6">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <div key={review.id} className="border-b border-border pb-6 last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                        {review.user?.first_name[0] || 'U'}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{review.user?.first_name} {review.user?.last_name}</p>
                        <div className="flex text-yellow-400">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              className={`w-3 h-3 ${star <= review.rating ? 'fill-current' : 'text-gray-300'}`} 
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-text-tertiary">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-text-secondary text-sm">{review.comment}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-text-tertiary">
                <Star className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p>Aún no hay reseñas. ¡Sé el primero en opinar!</p>
              </div>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
};

export default ProductDetail;
