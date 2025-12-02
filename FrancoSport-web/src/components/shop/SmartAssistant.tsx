"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, ChevronRight, Check } from "lucide-react";
import { getProducts } from "@/api/products.service";
import type { Product } from "@/types";
import { useCartStore } from "@/store/cartStore";
import toast from "react-hot-toast";

interface SmartAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

type QuizStep = "intro" | "surface" | "style" | "budget" | "processing" | "results";

interface QuizAnswers {
  surface: string;
  style: string;
  budget: string;
}

export const SmartAssistant = ({ isOpen, onClose }: SmartAssistantProps) => {
  const [step, setStep] = useState<QuizStep>("intro");
  const [answers, setAnswers] = useState<QuizAnswers>({
    surface: "",
    style: "",
    budget: "",
  });
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep("intro");
        setAnswers({ surface: "", style: "", budget: "" });
        setRecommendations([]);
      }, 500);
    }
  }, [isOpen]);

  const handleAnswer = (key: keyof QuizAnswers, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    
    if (key === "surface") setStep("style");
    if (key === "style") setStep("budget");
    if (key === "budget") {
      setStep("processing");
      processResults();
    }
  };

  const processResults = async () => {
    setLoading(true);
    try {
      // Simulate AI processing time
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Fetch products to filter
      // In a real AI scenario, we would send answers to an endpoint.
      // Here we simulate logic based on tags/categories.
      const response = await getProducts({ limit: 20, in_stock: true });
      const allProducts = response.data;

      // Simple scoring algorithm
      const scoredProducts = allProducts.map((product) => {
        let score = 0;
        // Simulate matching logic
        if (product.category?.name.toLowerCase().includes("elite")) score += 2;
        if (product.price > 100) score += 1;
        return { product, score };
      });

      // Sort by score and take top 3
      const topProducts = scoredProducts
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map((p) => p.product);

      setRecommendations(topProducts);
      setStep("results");
    } catch (error) {
      console.error("Error processing results:", error);
      toast.error("Error al procesar recomendaciones");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    const cartProduct = {
        id: product.id,
        name: product.name,
        slug: product.name.toLowerCase().replace(/ /g, '-'),
        price: product.price,
        image_url: product.images?.[0]?.url || '',
        description: product.description,
        stock: product.stock,
        low_stock_threshold: product.low_stock_threshold,
        weight: product.weight,
        sku: product.sku,
        is_active: product.is_active,
        is_featured: product.is_featured,
        category_id: product.category_id,
        brand_id: product.brand_id,
        images: product.images,
        created_at: product.created_at,
        updated_at: product.updated_at,
    };
    useCartStore.getState().addItem(cartProduct);
    toast.success("¡Excelente elección! Agregado al carrito");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden pointer-events-auto border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 p-2 rounded-xl">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg text-zinc-900 dark:text-white">
                      Asistente Inteligente
                    </h2>
                    <p className="text-xs text-zinc-500">
                      FrancoSport AI Advisor
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-zinc-500" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 md:p-10 flex-1 overflow-y-auto">
                <AnimatePresence mode="wait">
                  {step === "intro" && (
                    <motion.div
                      key="intro"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="text-center space-y-6"
                    >
                      <div className="w-20 h-20 bg-gradient-to-br from-primary to-purple-600 rounded-full mx-auto flex items-center justify-center shadow-lg shadow-primary/30">
                        <Sparkles className="w-10 h-10 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">
                        ¡Encuentra tu equipo ideal!
                      </h3>
                      <p className="text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
                        Responde 3 preguntas simples y nuestra IA analizará tu perfil para recomendarte los mejores productos para tu estilo de juego.
                      </p>
                      <button
                        onClick={() => setStep("surface")}
                        className="bg-black dark:bg-white text-white dark:text-black px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform flex items-center gap-2 mx-auto"
                      >
                        Comenzar
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </motion.div>
                  )}

                  {step === "surface" && (
                    <motion.div
                      key="surface"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <h3 className="text-xl font-bold text-center mb-8 dark:text-white">
                        ¿En qué superficie juegas principalmente?
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                          { id: "grass", label: "Césped Natural", icon: "🌱" },
                          { id: "synthetic", label: "Sintético", icon: "🏟️" },
                          { id: "indoor", label: "Futsal / Sala", icon: "court" },
                        ].map((option) => (
                          <button
                            key={option.id}
                            onClick={() => handleAnswer("surface", option.id)}
                            className="p-6 rounded-2xl border-2 border-zinc-100 dark:border-zinc-800 hover:border-primary dark:hover:border-primary hover:bg-primary/5 transition-all group text-left"
                          >
                            <span className="text-3xl mb-3 block">{option.icon === "court" ? "🪵" : option.icon}</span>
                            <span className="font-bold text-zinc-900 dark:text-white block group-hover:text-primary">
                              {option.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {step === "style" && (
                    <motion.div
                      key="style"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <h3 className="text-xl font-bold text-center mb-8 dark:text-white">
                        ¿Cuál es tu estilo de juego?
                      </h3>
                      <div className="grid grid-cols-1 gap-4">
                        {[
                          { id: "speed", label: "Velocidad y Desborde", desc: "Para extremos y delanteros rápidos.", icon: "⚡" },
                          { id: "control", label: "Control y Toque", desc: "Para mediocampistas y organizadores.", icon: "🎯" },
                          { id: "defense", label: "Defensa y Potencia", desc: "Para defensores y contención.", icon: "🛡️" },
                        ].map((option) => (
                          <button
                            key={option.id}
                            onClick={() => handleAnswer("style", option.id)}
                            className="p-4 rounded-2xl border-2 border-zinc-100 dark:border-zinc-800 hover:border-primary dark:hover:border-primary hover:bg-primary/5 transition-all group flex items-center gap-4 text-left"
                          >
                            <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-2xl group-hover:bg-white">
                              {option.icon}
                            </div>
                            <div>
                              <span className="font-bold text-zinc-900 dark:text-white block group-hover:text-primary">
                                {option.label}
                              </span>
                              <span className="text-sm text-zinc-500">
                                {option.desc}
                              </span>
                            </div>
                            <ChevronRight className="w-5 h-5 text-zinc-300 ml-auto group-hover:text-primary" />
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {step === "budget" && (
                    <motion.div
                      key="budget"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <h3 className="text-xl font-bold text-center mb-8 dark:text-white">
                        ¿Cuál es tu presupuesto aproximado?
                      </h3>
                      <div className="grid grid-cols-1 gap-4">
                        {[
                          { id: "entry", label: "Principiante", desc: "Hasta Bs. 150", icon: "💰" },
                          { id: "mid", label: "Intermedio", desc: "Bs. 150 - Bs. 300", icon: "💸" },
                          { id: "pro", label: "Profesional", desc: "Más de Bs. 300", icon: "💎" },
                        ].map((option) => (
                          <button
                            key={option.id}
                            onClick={() => handleAnswer("budget", option.id)}
                            className="p-4 rounded-2xl border-2 border-zinc-100 dark:border-zinc-800 hover:border-primary dark:hover:border-primary hover:bg-primary/5 transition-all group flex items-center gap-4 text-left"
                          >
                            <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-2xl group-hover:bg-white">
                              {option.icon}
                            </div>
                            <div>
                              <span className="font-bold text-zinc-900 dark:text-white block group-hover:text-primary">
                                {option.label}
                              </span>
                              <span className="text-sm text-zinc-500">
                                {option.desc}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {step === "processing" && (
                    <motion.div
                      key="processing"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center py-10 space-y-6"
                    >
                      <div className="relative w-24 h-24 mx-auto">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-0 border-4 border-zinc-100 dark:border-zinc-800 rounded-full"
                        />
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-0 border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
                          Analizando tu perfil...
                        </h3>
                        <p className="text-zinc-500">
                          Buscando los mejores productos para ti
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {step === "results" && (
                    <motion.div
                      key="results"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      <div className="text-center mb-6">
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                          ¡Encontramos tu Match Perfecto!
                        </h3>
                        <p className="text-zinc-500 text-sm">
                          Basado en tus preferencias de juego
                        </p>
                      </div>

                      <div className="space-y-4">
                        {recommendations.map((product, index) => (
                          <motion.div
                            key={product.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl flex gap-4 items-center border border-zinc-100 dark:border-zinc-800 hover:border-primary/50 transition-colors"
                          >
                            <div className="w-20 h-20 bg-white rounded-xl p-2 flex-shrink-0">
                              <img
                                src={product.images?.[0]?.url || ""}
                                alt={product.name}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start mb-1">
                                <h4 className="font-bold text-zinc-900 dark:text-white truncate pr-2">
                                  {product.name}
                                </h4>
                                <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Check className="w-3 h-3" />
                                  {98 - index * 5}% Match
                                </span>
                              </div>
                              <p className="text-xs text-zinc-500 line-clamp-1 mb-2">
                                {product.description}
                              </p>
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-primary">
                                  Bs. {product.price}
                                </span>
                                <button
                                  onClick={() => addToCart(product)}
                                  className="bg-black dark:bg-white text-white dark:text-black text-xs font-bold px-3 py-1.5 rounded-lg hover:opacity-80 transition-opacity"
                                >
                                  Comprar
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      <button
                        onClick={() => {
                          setStep("intro");
                          setAnswers({ surface: "", style: "", budget: "" });
                        }}
                        className="w-full text-center text-zinc-500 text-sm hover:text-zinc-900 dark:hover:text-white transition-colors mt-4"
                      >
                        Volver a empezar
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
