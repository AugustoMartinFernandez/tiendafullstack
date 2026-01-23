"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Product } from "@/lib/types";
import { Eye, ShoppingBag, Check, ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { useFavorites } from "@/context/favorites-context";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [isAdded, setIsAdded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  const isFav = isFavorite(product.id);

  // Lógica de precios y descuento
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discountPercentage = hasDiscount
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0;

  // Normalizamos imágenes para el slider
  const images = product.images && product.images.length > 0 ? product.images : (product.imageUrl ? [product.imageUrl] : ["/placeholder.png"]);
  const hasMultipleImages = images.length > 1;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Evita navegar al detalle
    e.stopPropagation(); // Detiene la propagación del click
    
    if (isAdded) return; // Evita doble clic

    addToCart(product);
    
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(product);
  };

  const scrollSlider = (direction: "left" | "right", e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!sliderRef.current) return;

    const scrollAmount = sliderRef.current.clientWidth;
    const newScrollPosition = direction === "left" 
      ? sliderRef.current.scrollLeft - scrollAmount 
      : sliderRef.current.scrollLeft + scrollAmount;

    sliderRef.current.scrollTo({ left: newScrollPosition, behavior: "smooth" });
  };

  const handleScroll = () => {
    if (!sliderRef.current) return;
    const index = Math.round(sliderRef.current.scrollLeft / sliderRef.current.clientWidth);
    setCurrentImageIndex(index);
  };

  // Stock visual logic (cap at 20 for visual bar)
  const stockPercentage = Math.min((product.stock / 20) * 100, 100);
  const stockColor = product.stock > 5 ? "bg-green-500" : "bg-red-500";

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      
      {/* ENLACE PRINCIPAL (Cubre toda la tarjeta usando absolute inset-0) */}
      <Link href={`/producto/${product.id}`} className="absolute inset-0 z-0" prefetch={false}>
        <span className="sr-only">Ver {product.name}</span>
      </Link>

      {/* --- SLIDER DE IMÁGENES --- */}
      <div className="relative aspect-square w-full overflow-hidden bg-gray-50">
        <div 
          ref={sliderRef}
          onScroll={handleScroll}
          className="flex h-full w-full overflow-x-auto snap-x snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {images.map((img, idx) => (
            <div key={idx} className="relative h-full w-full flex-shrink-0 snap-center">
              <Image
                src={img}
                alt={`${product.name} - Vista ${idx + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                priority={idx === 0} // Prioridad solo a la primera
              />
            </div>
          ))}
        </div>

        {/* Controles del Slider (Solo Desktop y si hay múltiples imágenes) */}
        {hasMultipleImages && (
          <>
            <button onClick={(e) => scrollSlider("left", e)} className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/80 text-gray-800 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white z-20 disabled:opacity-0" disabled={currentImageIndex === 0}>
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={(e) => scrollSlider("right", e)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/80 text-gray-800 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white z-20 disabled:opacity-0" disabled={currentImageIndex === images.length - 1}>
              <ChevronRight className="h-4 w-4" />
            </button>
            
            {/* Indicadores (Puntos) */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
              {images.map((_, idx) => (
                <div 
                  key={idx} 
                  className={cn("h-1.5 rounded-full transition-all shadow-sm", currentImageIndex === idx ? "w-4 bg-white" : "w-1.5 bg-white/50")} 
                />
              ))}
            </div>
          </>
        )}
        
        {/* Badges */}
        <div className="absolute left-3 top-3 z-10 flex flex-col gap-1">
          {hasDiscount && (
            <div className="rounded-full bg-red-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-md">
              -{discountPercentage}%
            </div>
          )}
          {product.stock <= 5 && product.stock > 0 && (
             <div className="rounded-full bg-orange-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-md">
               Últimos {product.stock}
             </div>
          )}
        </div>

        {/* Overlay de Acciones (Desktop) */}
        <div className="absolute inset-0 z-20 flex items-center justify-center gap-3 bg-black/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <button 
            onClick={handleToggleFavorite}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-110",
              isFav ? "bg-red-500 text-white" : "bg-white text-gray-900 hover:text-red-500"
            )}
            title={isFav ? "Quitar de favoritos" : "Agregar a favoritos"}
          >
            <Heart className={cn("h-5 w-5", isFav && "fill-current")} />
          </button>
          
          {/* BOTÓN AGREGAR (Desktop) */}
          <button 
            onClick={handleAddToCart}
            disabled={isAdded || product.stock === 0}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-110",
              isAdded ? "bg-green-500 text-white" : "bg-indigo-600 text-white hover:bg-indigo-700",
              product.stock === 0 && "bg-gray-400 cursor-not-allowed"
            )}
            title={product.stock === 0 ? "Sin Stock" : (isAdded ? "Agregado" : "Agregar al Carrito")}
          >
            {isAdded ? <Check className="h-5 w-5" /> : <ShoppingBag className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* --- CONTENIDO --- */}
      {/* pointer-events-none permite que los clicks en el texto pasen al Link de fondo */}
      <div className="flex flex-1 flex-col p-4 sm:p-5 pointer-events-none">
        {/* Categoría y Subcategoría */}
        <div className="mb-2 flex items-center gap-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
          <span>{product.category}</span>
          {product.subCategory && (
            <>
              <span className="text-gray-300">•</span>
              <span className="text-indigo-500">{product.subCategory}</span>
            </>
          )}
        </div>

        {/* Título (Truncado a 2 líneas) */}
        <h3 className="mb-2 text-sm font-bold text-gray-900 line-clamp-2 sm:text-base min-h-[2.5em]">
          {product.name}
        </h3>

        {/* SKU */}
        {product.sku && (
          <p className="mb-3 text-[10px] font-mono text-gray-400">SKU: {product.sku}</p>
        )}

        {/* Precios */}
        <div className="mt-auto flex flex-col gap-1">
          {hasDiscount && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-400 line-through">
                {formatPrice(product.originalPrice!)}
              </span>
              <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                {discountPercentage}% OFF
              </span>
            </div>
          )}
          <span className="text-lg font-black text-indigo-900 sm:text-xl whitespace-nowrap">
            {formatPrice(product.price)}
          </span>
        </div>

        {/* Barra de Stock Visual */}
        <div className="mt-3 w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={cn("h-full transition-all duration-500", stockColor)} 
            style={{ width: `${stockPercentage}%` }} 
          />
        </div>

        {/* Botón Móvil (Visible siempre) - pointer-events-auto reactiva los clicks */}
        <div className="mt-4 sm:hidden pointer-events-auto relative z-20">
          <button 
            onClick={handleAddToCart}
            disabled={isAdded || product.stock === 0}
            className={cn(
              "flex h-10 w-full items-center justify-center rounded-lg text-sm font-bold text-white shadow-sm active:scale-95 transition-all",
              isAdded ? "bg-green-500" : "bg-indigo-600",
              product.stock === 0 && "bg-gray-400 cursor-not-allowed"
            )}
          >
            {product.stock === 0 ? "Sin Stock" : (isAdded ? <><Check className="mr-2 h-5 w-5" /> Agregado</> : "Agregar al carrito")}
          </button>
        </div>
      </div>
    </div>
  );
}