import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container } from './Container';
import { Button, Badge } from '@/components/ui';
import {
  ShoppingCart,
  User,
  Heart,
  Search,
  Menu,
  X,
  Clock,
  LogOut,
} from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { useAuthStore, useCartStore, useUIStore } from '@/store';
import toast from 'react-hot-toast';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 59, seconds: 59 });

  // Get data from stores
  const { user, isAuthenticated, logout } = useAuthStore();
  const { itemsCount: cartItemsCount } = useCartStore();
  const { openCartDrawer } = useUIStore();
  
  // TODO: Implementar wishlist cuando esté listo
  const wishlistCount = 0;

  // Detectar scroll
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`${ROUTES.PRODUCTS}?search=${searchQuery}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Sesión cerrada correctamente');
    navigate(ROUTES.HOME);
  };

  const navigationLinks = [
    { label: 'Inicio', path: ROUTES.HOME },
    { label: 'Productos', path: ROUTES.PRODUCTS },
    { label: 'Categorías', path: ROUTES.CATEGORIES },
    { label: 'Marcas', path: ROUTES.BRANDS },
  ];

  return (
    <>
      {/* TOP BAR PROMOCIONAL */}
      <div className="bg-gradient-to-r from-red-700 to-red-900 text-white py-2 px-4 flex justify-center items-center text-sm font-bold tracking-wider relative z-[60]">
        <Clock size={16} className="mr-2 animate-pulse" />
        <span className="mr-4 uppercase hidden md:inline">
          Oferta de Lanzamiento: Envío Gratis &gt; Bs. 500
        </span>
        <div className="flex gap-2 font-mono bg-black/30 px-3 py-1 rounded items-center">
          <span className="text-red-300">{String(timeLeft.hours).padStart(2, '0')}h</span>:
          <span className="text-red-300">{String(timeLeft.minutes).padStart(2, '0')}m</span>:
          <span className="text-red-300 w-6 inline-block text-center">
            {String(timeLeft.seconds).padStart(2, '0')}s
          </span>
        </div>
      </div>

      {/* NAVBAR PRINCIPAL */}
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          isScrolled
            ? 'bg-background/95 backdrop-blur-md border-b border-surface-lighter'
            : 'bg-transparent'
        }`}
      >
        <Container>
          <div className="flex items-center justify-between h-20">
            {/* Logo con estilo "FRANCOSPORT" */}
            <Link to={ROUTES.HOME} className="flex items-center gap-2 group mr-12">
              <span className="text-3xl font-black italic tracking-tighter">
                FRANCO<span className="text-primary">SPORT</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              {navigationLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="text-text-secondary hover:text-primary transition-colors font-bold uppercase tracking-widest text-sm"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Search Bar (Desktop) */}
            <form
              onSubmit={handleSearch}
              className="hidden md:flex items-center gap-2 flex-1 max-w-md mx-8"
            >
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-tertiary" />
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-surface border border-surface-lighter rounded-md pl-10 pr-4 py-2 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
            </form>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Wishlist */}
              {wishlistCount > 0 && (
                <button
                  onClick={() => navigate(ROUTES.WISHLIST)}
                  className="hidden sm:flex relative p-2 text-text-secondary hover:text-primary transition-colors"
                  aria-label="Favoritos"
                >
                  <Heart className="h-6 w-6" />
                  <Badge
                    variant="danger"
                    size="sm"
                    className="absolute -top-1 -right-1 px-1.5 min-w-[20px]"
                  >
                    {wishlistCount}
                  </Badge>
                </button>
              )}

              {/* Cart - Abre el Drawer */}
              <button
                onClick={openCartDrawer}
                className="relative p-2 text-text-secondary hover:text-primary transition-colors"
                aria-label="Carrito"
              >
                <ShoppingCart className="h-6 w-6" />
                {cartItemsCount > 0 && (
                  <Badge
                    variant="primary"
                    size="sm"
                    className="absolute -top-1 -right-1 px-1.5 min-w-[20px]"
                  >
                    {cartItemsCount}
                  </Badge>
                )}
              </button>

              {/* User Menu */}
              {isAuthenticated && user ? (
                <div className="hidden sm:flex items-center gap-3">
                  {/* Admin Button */}
                  {user.role === 'ADMIN' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate(ROUTES.ADMIN_DASHBOARD)}
                      className="flex items-center gap-2"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      Admin
                    </Button>
                  )}

                  {/* User Info */}
                  <button
                    onClick={() => navigate(ROUTES.PROFILE)}
                    className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-surface-light transition-colors"
                  >
                    <User className="h-5 w-5 text-primary" />
                    <div className="text-left">
                      <p className="text-xs text-text-tertiary uppercase">Hola,</p>
                      <p className="text-sm font-bold text-text-primary leading-none">
                        {user.first_name}
                      </p>
                    </div>
                  </button>

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    className="p-2 text-text-secondary hover:text-primary transition-colors"
                    title="Cerrar sesión"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(ROUTES.LOGIN)}
                  >
                    Ingresar
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate(ROUTES.REGISTER)}
                  >
                    Registrarse
                  </Button>
                </div>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 text-text-secondary hover:text-primary transition-colors"
                aria-label="Menú"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Search */}
          <form onSubmit={handleSearch} className="md:hidden pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-tertiary" />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface border border-surface-lighter rounded-md pl-10 pr-4 py-2 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </form>
        </Container>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-surface-lighter bg-surface animate-slide-in">
            <Container>
              <nav className="py-4 space-y-2">
                {navigationLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block py-3 text-text-secondary hover:text-primary transition-colors font-bold uppercase tracking-widest text-sm"
                  >
                    {link.label}
                  </Link>
                ))}

                <div className="pt-4 border-t border-surface-lighter space-y-2">
                  {isAuthenticated && user ? (
                    <>
                      <button
                        onClick={() => {
                          navigate(ROUTES.PROFILE);
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full text-left py-3 text-text-secondary hover:text-primary transition-colors"
                      >
                        Mi Perfil ({user.first_name})
                      </button>
                      <button
                        onClick={() => {
                          handleLogout();
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full text-left py-3 text-primary hover:text-primary-700 transition-colors"
                      >
                        Cerrar Sesión
                      </button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        fullWidth
                        onClick={() => {
                          navigate(ROUTES.LOGIN);
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        Ingresar
                      </Button>
                      <Button
                        variant="primary"
                        fullWidth
                        onClick={() => {
                          navigate(ROUTES.REGISTER);
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        Registrarse
                      </Button>
                    </>
                  )}
                </div>
              </nav>
            </Container>
          </div>
        )}
      </header>
    </>
  );
};

export default Header;
