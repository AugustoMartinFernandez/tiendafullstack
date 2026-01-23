"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter, X } from "lucide-react";

export function ProductFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  
  // Inicializamos con los valores de la URL si existen
  const [minPrice, setMinPrice] = useState(searchParams.get("min") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("max") ?? "");

  const handleApply = () => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (minPrice) params.set("min", minPrice);
    else params.delete("min");
    
    if (maxPrice) params.set("max", maxPrice);
    else params.delete("max");

    // Reseteamos la paginación si existiera y empujamos la nueva URL
    router.push(`?${params.toString()}`);
    setIsOpen(false);
  };

  const handleClear = () => {
    setMinPrice("");
    setMaxPrice("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("min");
    params.delete("max");
    router.push(`?${params.toString()}`);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 text-sm font-bold transition-colors ${isOpen ? "text-indigo-600" : "text-gray-900 hover:text-indigo-600"}`}
      >
        <Filter className="h-4 w-4" />
        Filtrar Precio
      </button>

      {isOpen && (
        <>
          {/* Fondo invisible para cerrar al hacer clic afuera */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          
          {/* Dropdown del Filtro */}
          <div className="absolute right-0 top-10 z-20 w-72 rounded-2xl border border-gray-100 bg-white p-5 shadow-xl ring-1 ring-black ring-opacity-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">Rango de Precio</h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">$</span>
                <input 
                  type="number" 
                  placeholder="Min" 
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full h-10 pl-6 pr-3 rounded-lg border border-gray-200 text-sm font-bold focus:border-indigo-500 outline-none transition-all"
                />
              </div>
              <span className="text-gray-300 font-bold">-</span>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">$</span>
                <input 
                  type="number" 
                  placeholder="Max" 
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full h-10 pl-6 pr-3 rounded-lg border border-gray-200 text-sm font-bold focus:border-indigo-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={handleClear}
                className="flex-1 h-10 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Limpiar
              </button>
              <button 
                onClick={handleApply}
                className="flex-1 h-10 rounded-lg bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700 shadow-sm transition-colors"
              >
                Aplicar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}