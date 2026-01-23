"use client";

import { useState } from "react";
import { Heart, Share2, Check } from "lucide-react";
import { Product } from "@/lib/types";
import { useFavorites } from "@/context/favorites-context";
import { cn } from "@/lib/utils";

export function FavoriteButton({ product }: { product: Product }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorite = isFavorite(product.id);

  return (
    <button 
      onClick={() => toggleFavorite(product)}
      className={cn(
        "p-3 rounded-full transition-all duration-300",
        favorite 
          ? "bg-red-50 text-red-500 hover:bg-red-100" 
          : "bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-red-500"
      )}
      title={favorite ? "Quitar de favoritos" : "Agregar a favoritos"}
    >
      <Heart className={cn("h-6 w-6", favorite && "fill-current")} />
    </button>
  );
}

export function ShareButton({ productName }: { productName: string }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: productName,
          text: `Mirá este producto increíble: ${productName}`,
          url,
        });
      } catch (err) {
        // Share cancelado
      }
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button 
      onClick={handleShare}
      className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-gray-200 bg-white px-8 py-3 text-base font-bold text-gray-700 hover:bg-gray-50 transition-all active:scale-95"
    >
      {copied ? <Check className="h-5 w-5 text-green-600" /> : <Share2 className="h-5 w-5 text-gray-400" />}
      {copied ? "¡Enlace copiado!" : "Compartir producto"}
    </button>
  );
}