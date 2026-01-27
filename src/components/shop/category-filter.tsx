// src/components/shop/category-filter.tsx
"use client";

import { Product } from "@/lib/types";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { PRODUCT_CATEGORIES } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown } from "lucide-react";

interface CategoryFilterProps {
  allCategories?: string[];
  products?: Product[];
  currentCategory?: string;
  currentSubCategory?: string;
  isLoading?: boolean;
}

export function CategoryFilter({ allCategories = [], products = [], currentCategory, currentSubCategory, isLoading }: CategoryFilterProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="py-4 space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="shrink-0 h-9 w-24 rounded-full" />
          ))}
        </div>
      </div>
    );
  }

  // Extraer subcategorías disponibles por categoría principal
  const subCategoriesMap = products.reduce((acc, product) => {
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

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "all") {
      router.push(createUrl(undefined, undefined));
    } else {
      router.push(createUrl(value, undefined));
    }
  };

  const categoriesToDisplay = allCategories.length > 0 ? allCategories : PRODUCT_CATEGORIES;

  return (
    <div className="py-4 space-y-4 animate-in fade-in duration-500">
      {/* Mobile: Dropdown */}
      <div className="md:hidden relative">
        <label htmlFor="category-select" className="sr-only">Seleccionar categoría</label>
        <select
          id="category-select"
          value={currentCategory || "all"}
          onChange={handleCategoryChange}
          className="w-full h-12 px-4 pr-10 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer shadow-sm appearance-none"
        >
          <option value="all">Todas las categorías</option>
          {categoriesToDisplay.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
          <ChevronDown className="h-5 w-5" />
        </div>
      </div>

      {/* Desktop: Pills */}
      <div className="hidden md:flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <Link
          href={createUrl(undefined, undefined)}
          className={cn(
            "shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all border",
            !currentCategory 
              ? "bg-gray-900 text-white border-gray-900" 
              : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
          )}
        >
          Todos
        </Link>
        {categoriesToDisplay.map((cat) => (
          <Link
            key={cat}
            href={createUrl(cat, undefined)}
            className={cn(
              "shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all border",
              currentCategory === cat
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
            )}
          >
            {cat}
          </Link>
        ))}
      </div>

      {/* NIVEL 2: SUBCATEGORÍAS (Solo si hay categoría seleccionada y existen subcategorías) */}
      {currentCategory && subCategoriesMap[currentCategory] && subCategoriesMap[currentCategory].size > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide animate-in slide-in-from-top-2 fade-in duration-300">
          {Array.from(subCategoriesMap[currentCategory]).map((sub) => (
            <Link
              key={sub}
              href={createUrl(currentCategory, currentSubCategory === sub ? undefined : sub)}
              className={cn(
                "shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
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
