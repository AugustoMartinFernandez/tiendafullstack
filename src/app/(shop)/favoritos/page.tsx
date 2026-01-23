// src/app/(shop)/favoritos/page.tsx
"use client";

import { useFavorites } from "@/context/favorites-context";
import { ProductCard } from "@/components/shop/product-card";
import Link from "next/link";
import { Heart } from "lucide-react";

export default function FavoritesPage() {
  const { favorites } = useFavorites();

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl mb-2">
          Mis Favoritos
        </h1>
        <p className="text-gray-500 mb-8">
          Tus productos guardados para ver más tarde.
        </p>

        {favorites.length > 0 ? (
          <div className="grid grid-cols-1 gap-y-8 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {favorites.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-gray-100 rounded-3xl bg-gray-50/50">
            <div className="mx-auto h-20 w-20 rounded-full bg-white shadow-sm flex items-center justify-center mb-6">
              <Heart className="h-8 w-8 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Tu lista de deseos está vacía</h3>
            <p className="mt-2 text-sm text-gray-500 max-w-sm">
              ¿Viste algo que te gustó? Hacé clic en el corazón para guardarlo acá y no perderlo de vista.
            </p>
            <div className="mt-8">
              <Link
                href="/tienda"
                className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-8 py-3 text-base font-bold text-white shadow-lg hover:bg-indigo-700 hover:scale-105 transition-all"
              >
                Explorar Tienda
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
