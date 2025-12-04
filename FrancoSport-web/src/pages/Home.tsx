import React, { useState, useEffect } from 'react';
import { formatCurrency } from '@/utils/currency';
import { useNavigate } from 'react-router-dom';
import { Container } from '@/components/layout/Container';
import { Button, Card, CardContent } from '@/components/ui';
import {
  TrendingUp,
  Zap,
  Shield,
  Star,
  Trophy,
  ArrowRight,
} from 'lucide-react';
import { ROUTES } from '@/constants/routes';

import { useExperiment } from '@/hooks/useExperiment';
import { getCategories, getProducts } from '@/api/products.service';
import type { Category, Product } from '@/types';
import { getActivePromotions } from '@/api/promotions.service';
import type { Promotion } from '@/api/admin/promotions.service';
import { CardContainer, CardBody, CardItem } from '@/components/ui/3d-card';
import { useCartStore } from '@/store/cartStore';
import toast from 'react-hot-toast';
import { SmartAssistant } from '@/components/shop/SmartAssistant';
import { Sparkles } from 'lucide-react';
import { CommunityCarousel } from '@/components/home/CommunityCarousel';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [activePromotions, setActivePromotions] = useState<Promotion[]>([]);
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);
  
  // A/B Test: Hero CTA Text
  const heroCtaText = useExperiment('hero_cta_text', ['Ver Catálogo', 'Ofertas Exclusivas']);

  // Auto-slide del hero
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveHeroSlide((prev) => (prev === 0 ? 1 : 0));
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Active Promotions
  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        const promos = await getActivePromotions();
        setActivePromotions(promos);
      } catch (err) {
        console.error('Error fetching active promotions:', err);
      }
    };
    fetchPromotions();
  }, []);

  // Carousel for promotions
  useEffect(() => {
    if (activePromotions.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentPromoIndex((prev) => (prev + 1) % activePromotions.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [activePromotions]);

  // Countdown timer
  useEffect(() => {
    if (activePromotions.length === 0) return;
    
    const activePromotion = activePromotions[currentPromoIndex];

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(activePromotion.end_date).getTime();
      const distance = end - now;

      if (distance < 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      // Calculate total time
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      return { days, hours, minutes, seconds };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [activePromotions, currentPromoIndex]);

  // Fetch Categories
  const [categories, setCategories] = useState<Category[]>([]);
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const data = await getCategories();
        setCategories(data.filter(c => c.is_active));
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCats();
  }, []);

  const partners = [
    'Club Atlético Central',
    'Liga Universitaria',
    'Promo 2025 "Invictus"',
    'Escuela de Fútbol Elite',
    'Running Club Norte',
    'Torneo Relámpago',
  ];

  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  // Fetch Most Wanted Products (Dynamic Logic)
  const [mostWantedProducts, setMostWantedProducts] = useState<{
    bestSeller: Product | null;
    newest: Product | null;
    special: Product | null;
  }>({ bestSeller: null, newest: null, special: null });

  useEffect(() => {
    const fetchMostWanted = async () => {
      try {
        const [bestSellerRes, newestRes, specialRes] = await Promise.all([
          getProducts({ sort_by: 'popularity', limit: 1, in_stock: true }),
          getProducts({ sort_by: 'newest', limit: 1, in_stock: true }),
          getProducts({ tags: ['Edición Especial'], limit: 1, in_stock: true }) // Try tag first
        ]);

        // Fallback for special edition if no tag found: use featured
        let specialProduct = specialRes.data[0];
        if (!specialProduct) {
             const featuredRes = await getProducts({ is_featured: true, limit: 1, in_stock: true });
             specialProduct = featuredRes.data[0];
        }

        setMostWantedProducts({
          bestSeller: bestSellerRes.data[0] || null,
          newest: newestRes.data[0] || null,
          special: specialProduct || null,
        });
      } catch (err) {
        console.error('Error fetching most wanted products:', err);
      }
    };
    fetchMostWanted();
  }, []);

  const mostWantedCards = [
    { product: mostWantedProducts.bestSeller, label: 'Más Vendido', color: 'bg-amber-500' },
    { product: mostWantedProducts.newest, label: 'Nuevo Ingreso', color: 'bg-blue-500' },
    { product: mostWantedProducts.special, label: 'Edición Especial', color: 'bg-purple-500' },
  ].filter(item => item.product); // Filter out nulls

  return (
    <div className="min-h-screen">
      {/* HERO SECTION - Estilo Premium */}
      <header className="relative h-screen flex items-center overflow-hidden -mt-20">
        {/* Background con efecto parallax */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent z-10" />
          <img
            src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=2000"
            alt="Franco Sport Hero"
            className={`w-full h-full object-cover transition-transform duration-[15000ms] ease-linear ${
              activeHeroSlide === 0 ? 'scale-110' : 'scale-100'
            }`}
          />
        </div>

        <Container className="relative z-20 pt-32">
          <div className="max-w-3xl">
            {/* Badge superior */}
            <div className="flex items-center gap-4 mb-4 animate-fade-in">
              <span className="bg-primary text-white text-xs font-bold px-3 py-1 uppercase tracking-wider transform -skew-x-12">
                Nueva Colección 2025
              </span>
              <span className="flex items-center gap-2 text-text-secondary text-sm font-semibold uppercase tracking-wider">
                <Zap size={16} className="text-primary animate-pulse" /> Energía Pura
              </span>
            </div>

            {/* Título principal */}
            <h1 className="text-6xl md:text-8xl font-black italic uppercase leading-none mb-6 drop-shadow-2xl">
              NO ES SUERTE <br />
              <span className="text-gradient">ES ESFUERZO</span>
            </h1>

            {/* Descripción */}
            <p className="text-text-secondary text-lg md:text-xl max-w-xl mb-10 leading-relaxed">
              Viste la mentalidad de campeón. Diseños exclusivos, tecnología de alto rendimiento y
              la actitud que necesitas para ganar.
            </p>

            {/* CTAs */}
            <div className="flex flex-col md:flex-row gap-4">
              <Button
                size="lg"
                onClick={() => navigate(ROUTES.PRODUCTS)}
                className="group transform hover:-translate-y-1 shadow-lg shadow-primary/50"
                rightIcon={
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                }
              >
                {heroCtaText}
              </Button>
              <Button size="lg" variant="outline" className="backdrop-blur-sm">
                Personalizar
              </Button>
            </div>
          </div>
        </Container>

        {/* Promotion Banner Bar - Carousel */}
        {activePromotions.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 z-30 bg-black/60 backdrop-blur-md border-t border-white/10 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/10 animate-pulse" />
            <Container>
              <div className="relative flex flex-col md:flex-row items-center justify-between py-4 gap-4">
                {/* Left: Image & Info */}
                <div className="flex items-center gap-4 flex-1">
                  {activePromotions[currentPromoIndex].image_url && (
                    <img 
                      src={activePromotions[currentPromoIndex].image_url} 
                      alt={activePromotions[currentPromoIndex].title} 
                      className="w-16 h-16 object-cover rounded-lg border border-white/20 hidden md:block"
                    />
                  )}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-primary text-black font-black text-xs px-2 py-0.5 uppercase tracking-wider transform -skew-x-12">
                        Oferta Especial
                      </span>
                      {activePromotions[currentPromoIndex].discount_percent && (
                        <span className="text-primary font-bold text-sm">
                          {activePromotions[currentPromoIndex].discount_percent}% OFF
                        </span>
                      )}
                      {activePromotions.length > 1 && (
                        <div className="flex gap-1 ml-2">
                          {activePromotions.map((_, idx) => (
                            <div 
                              key={idx}
                              className={`w-1.5 h-1.5 rounded-full ${idx === currentPromoIndex ? 'bg-white' : 'bg-white/30'}`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    <h3 className="text-xl md:text-2xl font-black italic uppercase text-white leading-none">
                      {activePromotions[currentPromoIndex].title}
                    </h3>
                    {activePromotions[currentPromoIndex].description && (
                      <p className="text-sm text-gray-300 hidden md:block max-w-md truncate">
                        {activePromotions[currentPromoIndex].description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Countdown & CTA */}
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-4 bg-black/30 px-4 py-2 rounded-lg border border-white/10 hidden lg:flex">
                    <div className="flex flex-col items-center">
                      <span className="text-2xl font-bold font-mono text-primary leading-none">
                        {String(timeLeft.days).padStart(2, '0')}
                      </span>
                      <span className="text-[10px] text-gray-400 uppercase">Días</span>
                    </div>
                    <span className="text-xl font-bold text-gray-600">:</span>
                    <div className="flex flex-col items-center">
                      <span className="text-2xl font-bold font-mono text-primary leading-none">
                        {String(timeLeft.hours).padStart(2, '0')}
                      </span>
                      <span className="text-[10px] text-gray-400 uppercase">Horas</span>
                    </div>
                    <span className="text-xl font-bold text-gray-600">:</span>
                    <div className="flex flex-col items-center">
                      <span className="text-2xl font-bold font-mono text-primary leading-none">
                        {String(timeLeft.minutes).padStart(2, '0')}
                      </span>
                      <span className="text-[10px] text-gray-400 uppercase">Min</span>
                    </div>
                    <span className="text-xl font-bold text-gray-600">:</span>
                    <div className="flex flex-col items-center">
                      <span className="text-2xl font-bold font-mono text-primary leading-none">
                        {String(timeLeft.seconds).padStart(2, '0')}
                      </span>
                      <span className="text-[10px] text-gray-400 uppercase">Seg</span>
                    </div>
                  </div>

                  <Button 
                    size="sm" 
                    onClick={() => navigate(`/promociones/${activePromotions[currentPromoIndex].id}`)}
                    className="whitespace-nowrap shadow-lg shadow-primary/20"
                  >
                    Ver Oferta <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </Container>
          </div>
        )}
      </header>

      {/* CATEGORIES SECTION */}
      <section className="py-16 bg-background relative z-10">
        <Container>
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-black italic uppercase mb-2">
                Explora por <span className="text-primary">Categorías</span>
              </h2>
              <div className="h-1 w-24 bg-primary" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category) => (
              <div 
                key={category.id} 
                className="group cursor-pointer relative overflow-hidden rounded-2xl aspect-[3/4] border border-white/10 hover:border-primary/50 transition-all duration-500 shadow-2xl hover:shadow-primary/20"
                onClick={() => navigate(`${ROUTES.PRODUCTS}?category=${category.slug}`)}
              >
                {/* Image with Zoom Effect */}
                <div className="absolute inset-0 overflow-hidden">
                  <img 
                    src={category.image_url || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=800'} 
                    alt={category.name}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 group-hover:rotate-1"
                  />
                </div>

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500" />
                
                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-end p-6">
                  <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    <div className="h-1 w-12 bg-primary mb-4 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                    
                    <h3 className="text-3xl font-black uppercase italic text-white mb-2 leading-none tracking-tighter">
                      {category.name}
                    </h3>
                    
                    <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                      <span>Explorar Colección</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out pointer-events-none" />
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* PRODUCTOS DESTACADOS - Los Más Buscados */}
      <section className="py-24 bg-background relative z-10">
        <Container>
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <h2 className="text-4xl md:text-5xl font-black italic uppercase mb-2">
                Los Más <span className="text-primary">Buscados</span>
              </h2>
              <div className="h-1 w-24 bg-primary" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {mostWantedCards.map((item) => (
              <div key={`${item.label}-${item.product?.id}`} className="flex justify-center w-full">
                <CardContainer className="inter-var w-full">
                  <CardBody className="bg-white relative group/card dark:hover:shadow-2xl dark:hover:shadow-emerald-500/[0.1] dark:bg-black dark:border-white/[0.2] border-black/[0.1] w-full h-auto rounded-xl p-6 border">
                    <CardItem
                      translateZ="50"
                      className="text-xl font-bold text-neutral-600 dark:text-white"
                    >
                      {item.product?.name}
                    </CardItem>
                    <CardItem
                      as="p"
                      translateZ="60"
                      className="text-neutral-500 text-sm max-w-sm mt-2 dark:text-neutral-300"
                    >
                      {item.product?.description}
                    </CardItem>
                    <CardItem translateZ="100" className="w-full mt-4">
                      <div className="relative h-72 w-full flex items-center justify-center">
                        <img
                          src={item.product?.images?.[0]?.url || 'https://images.unsplash.com/photo-1577212017184-80cc3c0bcb85?auto=format&fit=crop&q=80&w=800'}
                          height="1000"
                          width="1000"
                          className="h-full w-full object-contain rounded-xl group-hover/card:shadow-xl transition-transform duration-300"
                          alt={item.product?.name}
                        />
                        <span className={`absolute top-0 right-0 ${item.color} text-white text-xs font-bold px-3 py-1 rounded-bl-lg shadow-md`}>
                          {item.label}
                        </span>
                      </div>
                    </CardItem>
                    <div className="flex justify-between items-center mt-20">
                      <CardItem
                        translateZ={20}
                        as="button"
                        className="px-4 py-2 rounded-xl text-xs font-normal dark:text-white"
                      >
                        {formatCurrency(Number(item.product?.price))}
                      </CardItem>
                      <CardItem
                        translateZ={20}
                        as="button"
                        onClick={() => {
                          if (item.product) {
                            useCartStore.getState().addItem(item.product);
                            toast.success('Producto agregado al carrito');
                          }
                        }}
                        className="px-4 py-2 rounded-xl bg-black dark:bg-white dark:text-black text-white text-xs font-bold"
                      >
                        Comprar ahora
                      </CardItem>
                    </div>
                  </CardBody>
                </CardContainer>
              </div>
            ))}
          </div>

          {/* Ver todos */}
          <div className="text-center mt-12">
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate(ROUTES.PRODUCTS)}
            >
              Ver Todos los Productos
            </Button>
          </div>
        </Container>
      </section>

      {/* TICKER DE PARTNERS */}
      <section className="py-12 bg-surface overflow-hidden relative border-y border-surface-lighter">
        <div className="ticker-container">
          <div className="ticker-content">
            {[...partners, ...partners].map((partner, index) => (
              <div
                key={index}
                className="ticker-item flex items-center gap-3 text-text-tertiary font-bold uppercase tracking-widest text-xl opacity-50 hover:opacity-100 transition-all"
              >
                <Trophy size={24} className="text-primary" />
                <span>{partner}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="py-20 bg-background">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              ¿Por qué elegir Franco Sport?
            </h2>
            <p className="text-text-secondary max-w-2xl mx-auto">
              Nos diferenciamos por nuestra calidad, servicio y compromiso con nuestros clientes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card hoverable variant="elevated">
              <CardContent className="text-center space-y-4 p-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Envío Rápido</h3>
                <p className="text-text-secondary">
                  Recibe tus productos en tiempo récord. Envío gratis en compras superiores a Bs.
                  500.
                </p>
              </CardContent>
            </Card>

            <Card hoverable variant="elevated">
              <CardContent className="text-center space-y-4 p-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Calidad Premium</h3>
                <p className="text-text-secondary">
                  Los mejores productos para deportistas exigentes. Marcas reconocidas y materiales
                  de primera.
                </p>
              </CardContent>
            </Card>

            <Card hoverable variant="elevated">
              <CardContent className="text-center space-y-4 p-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Compra Segura</h3>
                <p className="text-text-secondary">
                  Pago 100% seguro con Stripe. Tu información está protegida en todo momento.
                </p>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>

      {/* STATS SECTION */}
      <section className="py-20 bg-surface">
        <Container>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">1000+</div>
              <div className="text-text-secondary">Productos</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">500+</div>
              <div className="text-text-secondary">Clientes Felices</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">50+</div>
              <div className="text-text-secondary">Marcas</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">4.9</div>
              <div className="text-text-secondary flex items-center justify-center gap-1">
                <Star className="h-4 w-4 fill-primary text-primary" />
                Calificación
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* CTA FINAL */}
      <section className="py-20 bg-gradient-to-br from-primary/10 to-background">
        <Container>
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              ¿Listo para dar el siguiente paso?
            </h2>
            <p className="text-lg text-text-secondary">
              Únete a nuestra comunidad y descubre por qué somos la tienda deportiva #1 en Bolivia
            </p>
            <Button size="lg" onClick={() => navigate(ROUTES.REGISTER)}>
              Crear Cuenta Gratis
            </Button>
          </div>
        </Container>
      </section>

      {/* Estilos para el ticker */}
      {/* Brand Showcase Section */}
      <CommunityCarousel />

      <style>{`
        .ticker-container {
          overflow: hidden;
        }
        .ticker-content {
          display: flex;
          animation: scroll 30s linear infinite;
        }
        .ticker-item {
          flex-shrink: 0;
          margin-right: 3rem;
        }
        @keyframes scroll {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
      `}</style>
      {/* Smart Assistant FAB */}
      <button
        onClick={() => setIsAssistantOpen(true)}
        className="fixed bottom-6 left-6 z-40 bg-black dark:bg-white text-white dark:text-black p-4 rounded-full shadow-2xl hover:scale-110 transition-transform group flex items-center gap-2 pr-6"
      >
        <div className="relative">
          <Sparkles className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
          </span>
        </div>
        <span className="font-bold text-sm hidden group-hover:inline-block transition-all duration-300">
          Asistente IA
        </span>
      </button>

      <SmartAssistant 
        isOpen={isAssistantOpen} 
        onClose={() => setIsAssistantOpen(false)} 
      />
    </div>
  );
};

export default Home;
