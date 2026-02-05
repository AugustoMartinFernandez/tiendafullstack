// src/components/shop/category-filter.tsx
"use client";

import { Product } from "@/lib/types";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PRODUCT_CATEGORIES } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";

interface CategoryFilterProps {
  allCategories?: string[];
  products?: Product[];
  currentCategory?: string;
  currentSubCategory?: string;
  isLoading?: boolean;
}

export function CategoryFilter({ 
  allCategories = [], 
  products = [], 
  currentCategory, 
  currentSubCategory, 
  isLoading 
}: CategoryFilterProps) {
  const searchParams = useSearchParams();

  if (isLoading) {
    return (
      <div className="w-full space-y-3 py-2">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-4 sm:px-0">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="shrink-0 h-10 w-24 rounded-full" />
          ))}
        </div>
      </div>
    );
  }

  // 1. Categorías: Prioridad a props, fallback a constantes
  const categories = allCategories.length > 0 ? allCategories : PRODUCT_CATEGORIES;

  // 2. Calcular conteos por categoría (Facets)
  const categoryCounts = products.reduce((acc, product) => {
    const cat = product.category;
    if (cat) {
      acc[cat] = (acc[cat] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // 3. Subcategorías: Calculadas dinámicamente de los productos
  // Filtramos los productos que pertenecen a la categoría seleccionada
  // para ver qué subcategorías tienen disponibles.
  const subCategories = new Set<string>();
  if (currentCategory) {
    products.forEach(product => {
      if (product.category === currentCategory && product.subCategory) {
        subCategories.add(product.subCategory);
      }
    });
  }
  const availableSubCategories = Array.from(subCategories).sort();

  // Helper para construir URLs preservando otros parámetros (como search, min, max)
  // pero reseteando la página a 1.
  const createUrl = (cat?: string, sub?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (cat) params.set("category", cat);
    else params.delete("category");
    
    if (sub) params.set("subCategory", sub);
    else params.delete("subCategory");
    
    params.delete("page"); // Resetear a página 1 al filtrar
    
    return `?${params.toString()}`;
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      
      {/* NIVEL 1: CATEGORÍAS PRINCIPALES */}
      {/* Contenedor con scroll horizontal y padding lateral para móviles */}
      <div className="w-full overflow-x-auto scrollbar-hide touch-pan-x">
        <div className="flex gap-3 min-w-max px-1 pb-1">
          {/* Opción "Todas" */}
          <Link
            href={createUrl(undefined, undefined)}
            scroll={false}
            className={cn(
              "flex items-center justify-center px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-200 border select-none group",
              !currentCategory 
                ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200 ring-2 ring-indigo-100 ring-offset-2" 
                : "bg-gray-50 text-gray-600 border-transparent hover:bg-gray-100 hover:text-gray-900"
            )}
          >
            Todas
            <span className={cn(
              "ml-2 inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full text-[10px] font-extrabold transition-colors",
              !currentCategory 
                ? "bg-white/20 text-white" 
                : "bg-gray-200 text-gray-500 group-hover:bg-gray-300"
            )}>
              {products.length}
            </span>
          </Link>

          {/* Lista de Categorías */}
          {categories.map((cat) => {
            const count = categoryCounts[cat] || 0;
            return (
            <Link
              key={cat}
              href={createUrl(cat, undefined)}
              scroll={false}
              className={cn(
                "flex items-center justify-center px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-200 border select-none group",
                currentCategory === cat
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200 ring-2 ring-indigo-100 ring-offset-2"
                  : "bg-gray-50 text-gray-600 border-transparent hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              {cat}
              {count > 0 && (
                <span className={cn(
                  "ml-2 inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full text-[10px] font-extrabold transition-colors",
                  currentCategory === cat
                    ? "bg-white/20 text-white"
                    : "bg-gray-200 text-gray-500 group-hover:bg-gray-300"
                )}>
                  {count}
                </span>
              )}
            </Link>
            );
          })}
        </div>
      </div>

      {/* NIVEL 2: SUBCATEGORÍAS (Solo si hay categoría seleccionada y subcategorías disponibles) */}
      {currentCategory && availableSubCategories.length > 0 && (
        <div className="w-full overflow-x-auto scrollbar-hide touch-pan-x animate-in slide-in-from-top-1 fade-in duration-300">
          <div className="flex gap-2 min-w-max items-center px-1">
            
            {/* Botón "Todo en [Categoría]" */}
            <Link
              href={createUrl(currentCategory, undefined)}
              scroll={false}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-bold transition-all border select-none",
                !currentSubCategory
                  ? "bg-gray-800 text-white border-gray-800 shadow-sm"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700"
              )}
            >
              Todo en {currentCategory}
            </Link>

            {/* Lista de Subcategorías */}
            {availableSubCategories.map((sub) => (
              <Link
                key={sub}
                href={createUrl(currentCategory, sub)}
                scroll={false}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-bold transition-all border select-none",
                  currentSubCategory === sub
                    ? "bg-indigo-100 text-indigo-700 border-indigo-200"
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700"
                )}
              >
                {sub}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
