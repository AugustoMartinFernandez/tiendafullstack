"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ProductGalleryProps {
  images: string[];
  name: string;
}

export function ProductGallery({ images, name }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // --- LÓGICA DE SWIPE (Gestos Táctiles) ---
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  // Filtrar imágenes vacías o nulas por seguridad y asegurar que siempre haya un array
  const validImages = images.filter(Boolean);
  const displayImages = validImages.length > 0 ? validImages : ["/placeholder.png"];

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && selectedIndex < displayImages.length - 1) {
      setSelectedIndex((prev) => prev + 1);
    }
    if (isRightSwipe && selectedIndex > 0) {
      setSelectedIndex((prev) => prev - 1);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Imagen Principal */}
      <div 
        className="relative aspect-square w-full overflow-hidden rounded-3xl border border-gray-100 bg-gray-50 shadow-sm touch-pan-y"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <Image
          src={displayImages[selectedIndex]}
          alt={`Imagen principal de ${name}`}
          fill
          className="object-cover transition-transform duration-500 hover:scale-105"
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>

      {/* Miniaturas (Thumbnails) */}
      {displayImages.length > 1 && (
        <div className="grid grid-cols-4 gap-4 sm:grid-cols-5">
          {displayImages.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                "relative aspect-square overflow-hidden rounded-xl border bg-gray-50 transition-all",
                selectedIndex === index
                  ? "border-indigo-600 ring-2 ring-indigo-600/20 scale-95"
                  : "border-gray-100 hover:border-gray-300 hover:scale-105"
              )}
            >
              <Image
                src={image}
                alt={`Vista ${index + 1} de ${name}`}
                fill
                className="object-cover"
                sizes="100px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
