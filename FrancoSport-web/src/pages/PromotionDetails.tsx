import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPromotionById } from '@/api/promotions.service';
import type { Promotion } from '@/api/admin/promotions.service';
import { Button } from '@/components/ui';
import { Container } from '@/components/layout';
import { ArrowLeft, Calendar, Percent, Loader2, ShoppingBag, Tag } from 'lucide-react';
import ProductCard from '@/components/ui/ProductCard';
import type { Product } from '@/types';
import { motion, useScroll, useTransform, useMotionValue, useMotionTemplate } from 'framer-motion';

// HeroCard component moved outside
const HeroCard = ({ children }: { children: React.ReactNode }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <div
      className="group relative border border-white/10 bg-gray-900/50 overflow-hidden rounded-xl"
      onMouseMove={handleMouseMove}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              rgba(255, 255, 255, 0.1),
              transparent 80%
            )
          `,
        }}
      />
      {children}
    </div>
  );
};

const PromotionDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [promotion, setPromotion] = useState<(Omit<Promotion, 'products'> & { products: Product[] }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  
  // Parallax effect for hero
  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 1.1]);

  useEffect(() => {
    if (id) {
      fetchPromotion(parseInt(id));
    }
  }, [id]);

  const fetchPromotion = async (promoId: number) => {
    try {
      setIsLoading(true);
      const data = await getPromotionById(promoId);
      setPromotion(data);
    } catch (error) {
      console.error('Error fetching promotion:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black pt-24 pb-20 overflow-hidden" ref={containerRef}>
      {isLoading ? (
        <div className="flex justify-center items-center h-[60vh]">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      ) : !promotion ? (
        <Container>
          <div className="text-center py-20">
            <h2 className="text-3xl font-bold text-white mb-6">Promoción no encontrada</h2>
            <Button onClick={() => navigate('/')} variant="outline" className="text-lg px-8 py-6">
              Volver al inicio
            </Button>
          </div>
        </Container>
      ) : (
        <>
          {/* 3D Background Elements */}
          <div className="fixed inset-0 pointer-events-none z-0">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse delay-1000" />
          </div>

          {/* Hero Section with Parallax and 3D Tilt */}
          <div className="relative w-full mb-16 z-10">
            <motion.div 
              style={{ y, scale, opacity }}
              className="absolute inset-0 h-[60vh] w-full z-0"
            >
              <img
                src={promotion.image_url || "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=2000"}
                alt={promotion.title}
                className="w-full h-full object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/60 to-black" />
            </motion.div>
            
            <Container className="relative z-10 pt-20 pb-12">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Button 
                  variant="ghost" 
                  className="mb-8 text-white hover:bg-white/10 hover:text-primary transition-all duration-300 group"
                  onClick={() => navigate(-1)}
                >
                  <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" /> Volver
                </Button>
              </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-end">
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  <div className="flex flex-wrap items-center gap-4 mb-6">
                    <motion.span 
                      whileHover={{ scale: 1.05, rotate: -2 }}
                      className="bg-primary text-black font-black px-4 py-2 uppercase tracking-wider transform -skew-x-12 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]"
                    >
                      Oferta Especial
                    </motion.span>
                    {promotion.discount_percent && (
                      <motion.div 
                        whileHover={{ scale: 1.05, rotate: 2 }}
                        className="flex items-center gap-2 text-primary font-bold bg-black/80 px-4 py-2 rounded-lg backdrop-blur-md border border-primary/30 shadow-[0_0_15px_rgba(var(--primary),0.3)]"
                      >
                        <Percent className="w-5 h-5" />
                        <span className="text-xl">{promotion.discount_percent}% OFF</span>
                      </motion.div>
                    )}
                  </div>
                  
                  <h1 className="text-5xl md:text-7xl lg:text-8xl font-black italic uppercase text-white mb-6 leading-[0.9] tracking-tighter drop-shadow-2xl">
                    {promotion.title}
                  </h1>
                  
                  {promotion.description && (
                    <p className="text-xl text-gray-300 mb-8 max-w-2xl leading-relaxed border-l-4 border-primary pl-6">
                      {promotion.description}
                    </p>
                  )}

                  <div className="flex items-center gap-6 text-gray-400 text-sm font-medium bg-white/5 w-fit px-6 py-3 rounded-full backdrop-blur-sm border border-white/10">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      <span>Válido hasta: <span className="text-white">{new Date(promotion.end_date).toLocaleDateString()}</span></span>
                    </div>
                    <div className="w-px h-4 bg-white/20" />
                    <div className="flex items-center gap-2">
                      <Tag className="w-5 h-5 text-primary" />
                      <span>{promotion.products?.length || 0} Productos</span>
                    </div>
                  </div>
                </motion.div>

                {/* 3D Floating Card */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, rotateY: 30 }}
                  animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                  transition={{ duration: 1, type: "spring" }}
                  className="hidden lg:block perspective-1000"
                >
                  <div className="relative w-full aspect-square max-w-md mx-auto transform-style-3d rotate-y-12 hover:rotate-y-0 transition-transform duration-700">
                     <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-blue-500/20 rounded-3xl blur-2xl animate-pulse" />
                     <img 
                        src={promotion.image_url} 
                        alt="Promo Preview"
                        className="relative w-full h-full object-cover rounded-3xl shadow-2xl border border-white/10 z-10"
                     />
                     {/* Floating Elements */}
                     <motion.div 
                        animate={{ y: [0, -20, 0] }}
                        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                        className="absolute -top-10 -right-10 bg-black/80 backdrop-blur-xl p-6 rounded-2xl border border-primary/50 shadow-2xl z-20"
                     >
                        <Percent className="w-12 h-12 text-primary" />
                     </motion.div>
                     <motion.div 
                        animate={{ y: [0, 20, 0] }}
                        transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
                        className="absolute -bottom-5 -left-5 bg-white text-black p-4 rounded-xl font-bold shadow-xl z-20 flex items-center gap-2"
                     >
                        <ShoppingBag className="w-6 h-6" />
                        <span>Compra Ahora</span>
                     </motion.div>
                  </div>
                </motion.div>
              </div>
            </Container>
          </div>

          {/* Products Grid with Staggered Animation */}
          <Container className="relative z-10">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-3">
                  <span className="w-2 h-8 bg-primary block rounded-full" />
                  Productos Incluidos
                </h2>
                <p className="text-gray-400 text-lg ml-5">Explora los artículos seleccionados para esta promoción.</p>
              </div>
            </div>

            {promotion.products && promotion.products.length > 0 ? (
              <motion.div 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={{
                  visible: { transition: { staggerChildren: 0.1 } }
                }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
              >
                {promotion.products.map((product) => (
                  <motion.div
                    key={product.id}
                    variants={{
                      hidden: { opacity: 0, y: 50 },
                      visible: { opacity: 1, y: 0 }
                    }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <HeroCard>
                <div className="text-center py-32">
                  <ShoppingBag className="w-20 h-20 text-gray-700 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-white mb-2">No hay productos disponibles</h3>
                  <p className="text-gray-400 max-w-md mx-auto">
                    Actualmente no hay productos activos asociados a esta promoción. Por favor revisa más tarde.
                  </p>
                </div>
              </HeroCard>
            )}
          </Container>
        </>
      )}
    </div>
  );
};

export default PromotionDetails;
