"use client";
import { ParallaxScroll } from "../ui/parallax-scroll";

export function BrandShowcase() {
  return (
    <div className="w-full py-20 bg-neutral-50 dark:bg-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10 text-center">
        <h2 className="text-3xl md:text-5xl font-bold text-neutral-900 dark:text-white mb-4">
          Nuestra Comunidad
        </h2>
        <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
          Equipos, atletas e instituciones que confían en la calidad y diseño de FrancoSport.
          Únete a la familia de campeones.
        </p>
      </div>
      <ParallaxScroll images={images} />
    </div>
  );
}

const images = [
  "https://images.unsplash.com/photo-1574629810360-7efbbe436cd7?q=80&w=800&auto=format&fit=crop", // Soccer team huddle
  "https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=800&auto=format&fit=crop", // Football match action
  "https://images.unsplash.com/photo-1526232761682-d26e03ac148e?q=80&w=800&auto=format&fit=crop", // Soccer shoes close up
  "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?q=80&w=800&auto=format&fit=crop", // Soccer player running
  "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?q=80&w=800&auto=format&fit=crop", // Stadium crowd
  "https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?q=80&w=800&auto=format&fit=crop", // Futsal indoor
  "https://images.unsplash.com/photo-1552667466-07770ae110d0?q=80&w=800&auto=format&fit=crop", // Team celebration
  "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=800&auto=format&fit=crop", // Training session
  "https://images.unsplash.com/photo-1628891890463-858804106858?q=80&w=800&auto=format&fit=crop", // Jersey detail
  "https://images.unsplash.com/photo-1511886929837-354d827aae26?q=80&w=800&auto=format&fit=crop", // Goal net
  "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?q=80&w=800&auto=format&fit=crop", // Goalkeeper save
  "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?q=80&w=800&auto=format&fit=crop", // Kids playing soccer
];
