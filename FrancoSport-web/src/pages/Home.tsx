import React, { useState, useEffect } from 'react';
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
  ShoppingBag,
} from 'lucide-react';
import { ROUTES } from '@/constants/routes';

import { useExperiment } from '@/hooks/useExperiment';
import { getCategories } from '@/api/products.service';
import type { Category } from '@/types';
import { getActivePromotion } from '@/api/promotions.service';
import type { Promotion } from '@/api/admin/promotions.service';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [activePromotion, setActivePromotion] = useState<Promotion | null>(null);
  
  // A/B Test: Hero CTA Text
  const heroCtaText = useExperiment('hero_cta_text', ['Ver Catálogo', 'Ofertas Exclusivas']);

  // Auto-slide del hero
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveHeroSlide((prev) => (prev === 0 ? 1 : 0));
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Active Promotion
  useEffect(() => {
    const fetchPromotion = async () => {
      try {
        const promo = await getActivePromotion();
        setActivePromotion(promo);
      } catch (err) {
        console.error('Error fetching active promotion:', err);
      }
    };
    fetchPromotion();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!activePromotion) return;

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
  }, [activePromotion]);

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

  // Productos destacados (placeholder - reemplazar con datos reales)
  const featuredProducts = [
    {
      id: 1,
      name: 'Edición Limitada Carbono',
      price: 180,
      category: 'Elite',
      image: 'https://images.unsplash.com/photo-1577212017184-80cc3c0bcb85?auto=format&fit=crop&q=80&w=800',
      tag: 'Más Vendido',
      description: 'Diseño aerodinámico en escala de grises. No es suerte, es esfuerzo.',
    },
    {
      id: 2,
      name: 'Red Racing Beast',
      price: 165,
      category: 'Pro',
      image: 'https://images.unsplash.com/photo-1620799140408-ed5341cd2431?auto=format&fit=crop&q=80&w=800',
      tag: 'Nuevo',
      description: 'Geometría agresiva para dominar la pista. Tonos rojos vibrantes.',
    },
    {
      id: 3,
      name: 'White Cross Series',
      price: 150,
      category: 'Sport',
      image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&q=80&w=800',
      tag: null,
      description: 'Elegancia y rendimiento. Detalles en negro y rojo sobre base blanca.',
    },
    {
      id: 4,
      name: 'Polo Promo 86',
      price: 120,
      category: 'Casual',
      image: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?auto=format&fit=crop&q=80&w=800',
      tag: 'Edición Especial',
      description: 'Vivir, estudiar, triunfar. La elegancia del legado.',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* HERO SECTION - Estilo Premium */}
      <header className="relative h-screen flex items-center overflow-hidden -mt-20">
        {/* Background con efecto parallax */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent z-10" />
          <img
            src={activePromotion?.image_url || "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=2000"}
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

        {/* Promotion Banner Bar */}
        {activePromotion && (
          <div className="absolute bottom-0 left-0 right-0 z-30 bg-black/40 backdrop-blur-md border-t border-white/10 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-purple-500/20 to-primary/20 animate-pulse" />
            <Container>
              <div className="relative flex flex-col md:flex-row items-center justify-between py-4 gap-4">
                {/* Left: Title & Description */}
                <div className="flex items-center gap-4">
                  <div className="bg-primary text-black font-black text-xs px-2 py-1 uppercase tracking-wider transform -skew-x-12">
                    Oferta Especial
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-xl md:text-2xl font-black italic uppercase text-white leading-none">
                      {activePromotion.title}
                    </h3>
                    {activePromotion.description && (
                      <p className="text-sm text-gray-300 hidden md:block">
                        {activePromotion.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Countdown & CTA */}
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-4 bg-black/30 px-4 py-2 rounded-lg border border-white/10">
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
                    onClick={() => navigate(ROUTES.PRODUCTS)}
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((product) => (
              <div key={product.id} className="group relative">
                <div className="relative overflow-hidden bg-surface aspect-[3/4] border border-surface-lighter rounded-lg">
                  {/* Tag */}
                  {product.tag && (
                    <div className="absolute top-4 left-0 bg-white text-black text-xs font-bold px-3 py-1 z-10 uppercase tracking-wider transform -skew-x-12">
                      {product.tag}
                    </div>
                  )}

                  {/* Imagen */}
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                  />

                  {/* Overlay con botón */}
                  <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-black to-transparent">
                    <Button
                      onClick={() => navigate(ROUTES.CART)}
                      className="w-full"
                      leftIcon={<ShoppingBag size={18} />}
                    >
                      Añadir
                    </Button>
                  </div>
                </div>

                {/* Info del producto */}
                <div className="mt-4">
                  <p className="text-xs text-primary font-bold uppercase tracking-widest mb-1">
                    {product.category}
                  </p>
                  <h3 className="text-xl font-bold uppercase italic mb-1 group-hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-black">Bs. {product.price}</span>
                  </div>
                </div>
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
    </div>
  );
};

export default Home;
