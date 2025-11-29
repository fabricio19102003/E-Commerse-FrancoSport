import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from '@/components/layout/Container';
import { Button, Card, CardContent, Badge } from '@/components/ui';
import {
  ShoppingCart,
  TrendingUp,
  Zap,
  Truck,
  Shield,
  Star,
  Trophy,
  Clock,
  ArrowRight,
  ShoppingBag,
} from 'lucide-react';
import { ROUTES } from '@/constants/routes';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);
  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 59, seconds: 59 });

  // Auto-slide del hero
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveHeroSlide((prev) => (prev === 0 ? 1 : 0));
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
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
                Ver Catálogo
              </Button>
              <Button size="lg" variant="outline" className="backdrop-blur-sm">
                Personalizar
              </Button>
            </div>
          </div>
        </Container>

        {/* Countdown Timer */}
        <div className="absolute bottom-8 right-8 z-20 hidden lg:flex items-center gap-3 bg-surface/80 backdrop-blur-md px-6 py-3 rounded-lg border border-primary/20">
          <Clock size={20} className="text-primary animate-pulse" />
          <span className="text-sm font-bold uppercase text-text-secondary">Oferta Termina en:</span>
          <div className="flex gap-2 font-mono text-primary">
            <span>{String(timeLeft.hours).padStart(2, '0')}h</span>:
            <span>{String(timeLeft.minutes).padStart(2, '0')}m</span>:
            <span>{String(timeLeft.seconds).padStart(2, '0')}s</span>
          </div>
        </div>
      </header>

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
