"use client";

import { useFavorites } from "@/context/favorites-context";
import { ProductCard } from "@/components/shop/product-card";
import { ProductCardSkeleton } from "@/components/shop/skeletons";
import { ClearFavoritesButton } from "@/components/shop/clear-favorites-button";
import Link from "next/link";
import { Heart } from "lucide-react";

export default function FavoritesPage() {
  const { favorites, isLoaded } = useFavorites();

  // 1. ESTADO DE CARGA (Skeletons)
  if (!isLoaded) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-black text-gray-900 mb-8">Mis Favoritos</h1>
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // 2. ESTADO VACÍO
  if (favorites.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-100 rounded-3xl bg-gray-50/50 p-10 animate-in fade-in zoom-in-95">
          <div className="p-4 bg-white rounded-full mb-4 shadow-sm">
            <Heart className="h-8 w-8 text-gray-300" />
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-2">No tenés favoritos aún</h2>
          <p className="text-sm text-gray-500 mb-6 max-w-md">
            Guardá los productos que más te gusten para no perderlos de vista.
          </p>
          <Link
            href="/tienda"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 active:scale-95"
          >
            Explorar Tienda
          </Link>
        </div>
      </div>
    );
  }

  // 3. CON DATOS
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black text-gray-900">Mis Favoritos</h1>
        <ClearFavoritesButton />
      </div>
      
      <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
        {favorites.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}