"use client";
import React from "react";
import { Carousel, Card } from "@/components/ui/apple-cards-carousel";

export function CommunityCarousel() {
  const cards = data.map((card, index) => (
    <Card key={card.src} card={card} index={index} />
  ));

  return (
    <div className="w-full h-full py-20 bg-neutral-50 dark:bg-neutral-900">
      <h2 className="max-w-7xl pl-4 mx-auto text-xl md:text-5xl font-bold text-neutral-800 dark:text-neutral-200 font-sans">
        Nuestra Comunidad FrancoSport
      </h2>
      <Carousel items={cards} />
    </div>
  );
}

const DummyContent = ({ title, description, image }: { title: string, description: string, image: string }) => {
  return (
    <>
      <div
        className="bg-[#F5F5F7] dark:bg-neutral-800 p-8 md:p-14 rounded-3xl mb-4"
      >
        <p className="text-neutral-600 dark:text-neutral-400 text-base md:text-2xl font-sans max-w-3xl mx-auto">
          <span className="font-bold text-neutral-700 dark:text-neutral-200">
            {title}
          </span>{" "}
          {description}
        </p>
        <img
          src={image}
          alt="FrancoSport Community"
          height="500"
          width="500"
          className="md:w-1/2 md:h-1/2 h-full w-full mx-auto object-contain mt-10 rounded-xl"
        />
      </div>
    </>
  );
};

const data = [
  {
    category: "Astros de Pando",
    title: "Bienvenido Astros de Pando",
    src: "/assets/community/community-1.jpg",
    content: <DummyContent 
      title="Astros de Pando se une a la familia." 
      description="Estamos orgullosos de vestir a los futuros campeones. Gracias por creer en nosotros." 
      image="/assets/community/community-1.jpg" 
    />,
  },
  {
    category: "Motocross",
    title: "Fercho 174",
    src: "/assets/community/community-2.jpg",
    content: <DummyContent 
      title="Adrenalina y Velocidad." 
      description="Apoyando al talento nacional en cada carrera. Fercho 174 confía en FrancoSport." 
      image="/assets/community/community-2.jpg" 
    />,
  },
  {
    category: "Futsal",
    title: "Mariscal Sucre Joyas",
    src: "/assets/community/community-3.png",
    content: <DummyContent 
      title="Pasión por el Futsal." 
      description="Bienvenidos Mariscal Sucre Joyas. Listos para brillar en la cancha." 
      image="/assets/community/community-3.png" 
    />,
  },
  {
    category: "Promoción",
    title: "Vaca Díez Promo 86",
    src: "/assets/community/community-4.jpg",
    content: <DummyContent 
      title="Vivir, Estudiar, Triunfar." 
      description="Celebrando la historia y el legado de la Promo 86 del Vaca Díez." 
      image="/assets/community/community-4.jpg" 
    />,
  },
  {
    category: "Racing",
    title: "Team Racing Cobija",
    src: "/assets/community/community-5.jpg",
    content: <DummyContent 
      title="Team Racing Cobija." 
      description="Somos la nueva piel del equipo. Velocidad y estilo en cada competencia." 
      image="/assets/community/community-5.jpg" 
    />,
  },
];
