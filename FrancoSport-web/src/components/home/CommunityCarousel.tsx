"use client";
import React, { useEffect, useState } from "react";
import { Carousel, Card } from "@/components/ui/apple-cards-carousel";
import api from "@/api/axios";

interface CommunityPost {
  id: number;
  title: string;
  category: string;
  description: string;
  image_url: string;
}

export function CommunityCarousel() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await api.get('/community');
        setPosts(response.data);
      } catch (error) {
        console.error('Error fetching community posts:', error);
      }
    };

    fetchPosts();
  }, []);

  if (posts.length === 0) return null;

  const cards = posts.map((post, index) => (
    <Card key={post.id} card={{
      category: post.category,
      title: post.title,
      src: post.image_url,
      content: <CommunityContent title={post.title} description={post.description} image={post.image_url} />
    }} index={index} />
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

const CommunityContent = ({ title, description, image }: { title: string, description: string, image: string }) => {
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
