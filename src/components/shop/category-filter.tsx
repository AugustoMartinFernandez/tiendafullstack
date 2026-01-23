"use client";

import { Product } from "@/lib/types";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface CategoryFilterProps {
  products: Product[];
  currentCategory?: string;
  currentSubCategory?: string;
}

export function CategoryFilter({ products, currentCategory, currentSubCategory }: CategoryFilterProps) {
  const searchParams = useSearchParams();

  // Extraer categorías únicas y sus subcategorías
  const categories = products.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = new Set();
    }
    if (product.subCategory) {
      acc[product.category].add(product.subCategory);
    }
    return acc;
  }, {} as Record<string, Set<string>>);

  const createUrl = (cat?: string, sub?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (cat) params.set("category", cat);
    else params.delete("category");
    
    if (sub) params.set("subCategory", sub);
    else params.delete("subCategory");
    
    return `?${params.toString()}`;
  };

  return (
    <div className="py-4 space-y-4">
      {/* NIVEL 1: CATEGORÍAS PRINCIPALES */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <Link
          href={createUrl(undefined, undefined)}
          className={cn(
            "flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all border",
            !currentCategory 
              ? "bg-gray-900 text-white border-gray-900" 
              : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
          )}
        >
          Todos
        </Link>
        {Object.keys(categories).map((cat) => (
          <Link
            key={cat}
            href={createUrl(cat, undefined)}
            className={cn(
              "flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all border",
              currentCategory === cat
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
            )}
          >
            {cat}
          </Link>
        ))}
      </div>

      {/* NIVEL 2: SUBCATEGORÍAS (Solo si hay categoría seleccionada) */}
      {currentCategory && categories[currentCategory] && categories[currentCategory].size > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide animate-in slide-in-from-top-2 fade-in duration-300">
          {Array.from(categories[currentCategory]).map((sub) => (
            <Link
              key={sub}
              href={createUrl(currentCategory, currentSubCategory === sub ? undefined : sub)}
              className={cn(
                "flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                currentSubCategory === sub
                  ? "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-500/20"
                  : "bg-gray-50 text-gray-500 hover:bg-gray-100"
              )}
            >
              {sub}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}