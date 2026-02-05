"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ChevronRight, X } from "lucide-react";

interface ShopSidebarProps {
  categories: string[];
  className?: string;
  onClose?: () => void; // Para cerrar el modal en móvil
}

export function ShopSidebar({ categories = [], className, onClose }: ShopSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Estado local para los inputs de precio
  const [minPrice, setMinPrice] = useState(searchParams.get("min") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("max") ?? "");

  // Sincronizar inputs si cambia la URL
  useEffect(() => {
    setMinPrice(searchParams.get("min") ?? "");
    setMaxPrice(searchParams.get("max") ?? "");
  }, [searchParams]);

  const currentCategory = searchParams.get("category");

  const createUrl = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) params.delete(key);
      else params.set(key, value);
    });
    params.delete("page");
    return `?${params.toString()}`;
  };

  const handlePriceFilter = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    
    if (minPrice) params.set("min", minPrice); else params.delete("min");
    if (maxPrice) params.set("max", maxPrice); else params.delete("max");
    
    params.delete("page");
    router.push(`?${params.toString()}`);
    if (onClose) onClose();
  };

  const handleClearAll = () => {
    router.push("/tienda");
    if (onClose) onClose();
  };

  return (
    <div className={cn("flex flex-col gap-8 pb-10", className)}>
      
      {/* 🗑️ ELIMINAMOS EL HEADER MÓVIL DUPLICADO AQUÍ */}

      {/* SECCIÓN 1: CATEGORÍAS */}
      <div>
        <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide mb-4">
          Categorías
        </h3>
        
        <div className="flex flex-col gap-2">
          {/* Opción "Todas" */}
          <Link
            href="/tienda"
            className={cn(
              "text-sm font-medium transition-colors hover:text-indigo-600 flex items-center justify-between group",
              !currentCategory ? "text-indigo-600 font-bold" : "text-gray-600"
            )}
            onClick={onClose}
          >
            Todas las categorías
            {!currentCategory && <ChevronRight className="w-4 h-4" />}
          </Link>

          {/* Lista de Categorías */}
          {categories.map((cat) => (
            <Link
              key={cat}
              href={createUrl({ category: cat })}
              className={cn(
                "text-sm transition-colors hover:text-indigo-600 flex items-center justify-between group py-1",
                currentCategory === cat 
                  ? "text-indigo-600 font-bold pl-2 border-l-2 border-indigo-600" 
                  : "text-gray-600"
              )}
              onClick={onClose}
            >
              {cat}
              {currentCategory === cat && <ChevronRight className="w-4 h-4" />}
            </Link>
          ))}
        </div>
      </div>

      {/* SECCIÓN 2: PRECIO */}
      <div>
        <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide mb-4">
          Precio
        </h3>
        
        <form onSubmit={handlePriceFilter} className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
              <input
                type="number"
                placeholder="Mínimo"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full pl-6 pr-2 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <span className="text-gray-400">-</span>
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
              <input
                type="number"
                placeholder="Máximo"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full pl-6 pr-2 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-white border border-gray-200 text-gray-900 py-2 rounded-lg text-sm font-bold hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              Aplicar
            </button>
            {(minPrice || maxPrice || currentCategory) && (
              <button
                type="button"
                onClick={handleClearAll}
                className="px-3 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Limpiar filtros"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}