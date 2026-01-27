"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart } from "lucide-react";
import { Product } from "@/lib/types";
import { useCart } from "@/context/cart-context";
import { useFavorites } from "@/context/favorites-context";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite, recentlyAddedId } = useFavorites();
  
  const isFav = isFavorite(product.id);
  
  // 1. Detectamos si este producto es el que se acaba de agregar
  const isAnimating = recentlyAddedId === product.id;

  return (
    <Link href={`/producto/${product.id}`} className="group block space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-100">
        {product.images?.[0] && (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        )}
        
        {/* Botón de Favoritos con Animación Ping */}
        <button
          onClick={(e) => {
            e.preventDefault(); // Evitar navegación del Link
            toggleFavorite(product);
          }}
          className="absolute top-3 right-3 z-20 p-2 rounded-full bg-white/90 shadow-sm hover:bg-white transition-all active:scale-90"
        >
          <div className="relative flex items-center justify-center">
            {/* 2. CAPA DE ANIMACIÓN: Se renderiza solo si isAnimating es true */}
            {isAnimating && (
              <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />
            )}
            
            {/* ICONO */}
            <Heart
              className={cn(
                "relative z-10 w-5 h-5 transition-colors duration-300",
                isFav ? "fill-red-500 text-red-500" : "text-gray-400 hover:text-red-400"
              )}
            />
          </div>
        </button>

        {/* Botón Rápido de Carrito (Opcional) */}
        <button
          onClick={(e) => {
            e.preventDefault();
            addToCart(product);
          }}
          className="absolute bottom-3 right-3 z-20 p-2 rounded-full bg-black/90 text-white shadow-sm hover:bg-black transition-all active:scale-90 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0"
        >
          <ShoppingCart className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-1">
        <h3 className="font-medium text-gray-900">{product.name}</h3>
        <p className="text-sm text-gray-500">{product.category}</p>
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-900">${product.price}</span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-sm text-gray-400 line-through">${product.originalPrice}</span>
          )}
        </div>
      </div>
    </Link>
  );
}