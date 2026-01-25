// src/components/shop/search-input.tsx
"use client";

import { Search, Loader2, X, History, Tag } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { getStoreProducts, getCategories } from "@/lib/actions";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { Product } from "@/lib/types";

export function SearchInput() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  
  // 1. Estado local para el input (lo inicializamos con lo que haya en la URL)
  const [term, setTerm] = useState(() => searchParams.get("search") || "");
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem("shop_recent_searches");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [suggestions, setSuggestions] = useState<Product[]>([]); // Estado para productos sugeridos
  const [suggestedCategories, setSuggestedCategories] = useState<string[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>([]);

  // NUEVO: Ref para rastrear el último término que NOSOTROS enviamos a la URL.
  // Esto actúa como un escudo para que la respuesta de la URL no nos borre lo que escribimos.
  const lastPushedTerm = useRef(searchParams.get("search") || "");

  // Calculamos si está cargando comparando el input actual con lo que hay en la URL
  const isSearching = term !== (searchParams.get("search") || "");

  // 2. Sincronizar estado si la URL cambia externamente (ej: al limpiar filtros)
  useEffect(() => {
    const urlSearch = searchParams.get("search") || "";
    // Solo actualizamos el input si la URL es diferente Y si NO es lo que acabamos de enviar nosotros
    if (urlSearch !== term && urlSearch !== lastPushedTerm.current) {
      const t = setTimeout(() => {
        setTerm(urlSearch);
        lastPushedTerm.current = urlSearch; // Sincronizamos para futuros cambios
      }, 0);
      return () => clearTimeout(t);
    }
  }, [searchParams, term]);

  // 4. Cargar todas las categorías al montar (para filtrado rápido)
  useEffect(() => {
    getCategories().then(setAllCategories).catch(console.error);
  }, []);

  // 4. Lógica de Autocompletado (Sugerencias de Productos)
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!term.trim()) {
        setSuggestions([]);
        setSuggestedCategories([]);
        return;
      }

      // Filtrar categorías localmente
      const matchingCats = allCategories.filter(cat => 
        cat.toLowerCase().includes(term.toLowerCase())
      ).slice(0, 3);
      setSuggestedCategories(matchingCats);

      try {
        // Traemos máximo 5 productos que coincidan
        const results = await getStoreProducts({ search: term, limitCount: 5 });
        setSuggestions(results);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      }
    };

    // Debounce rápido (300ms) para que las sugerencias aparezcan antes que la búsqueda completa
    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [term, allCategories]);

  // 3. Lógica de Debounce: Esperar a que el usuario deje de escribir
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const currentSearch = searchParams.get("search") || "";
      
      // Solo actualizamos la URL si el término realmente cambió
      if (term !== currentSearch) {
        const params = new URLSearchParams(searchParams.toString());
        const cleanTerm = term.trim();
        
        if (cleanTerm) {
          params.set("search", cleanTerm);
        } else {
          params.delete("search");
        }
        
        // Guardamos en la ref lo que estamos por enviar
        lastPushedTerm.current = cleanTerm;

        // Usamos 'replace' en lugar de 'push' para no llenar el historial del navegador
        // scroll: false evita que la página salte hacia arriba al escribir
        router.replace(`/tienda?${params.toString()}`, { scroll: false });
      }
    }, 500); // 500ms de espera (puedes ajustarlo a 300ms si quieres que sea más rápido)

    return () => clearTimeout(timeoutId);
  }, [term, router, searchParams]);

  // Helpers para el historial
  const saveToHistory = (val: string) => {
    const clean = val.trim();
    if (!clean) return;
    
    setRecentSearches(prev => {
      const filtered = prev.filter(item => item.toLowerCase() !== clean.toLowerCase());
      const updated = [clean, ...filtered].slice(0, 5); // Guardamos los últimos 5
      localStorage.setItem("shop_recent_searches", JSON.stringify(updated));
      return updated;
    });
  };

  const removeFromHistory = (e: React.MouseEvent, val: string) => {
    e.stopPropagation(); // Evitar que seleccione el item al borrar
    setRecentSearches(prev => {
      const updated = prev.filter(item => item !== val);
      localStorage.setItem("shop_recent_searches", JSON.stringify(updated));
      return updated;
    });
    inputRef.current?.focus();
  };

  const handleClear = () => {
    setTerm("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      saveToHistory(term);
      inputRef.current?.blur();
    }
  };

  // Helper para resaltar coincidencias en negrita y color
  const highlightMatch = (text: string) => {
    if (!term.trim()) return text;
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, "gi");
    return text.split(regex).map((part, i) => 
      regex.test(part) ? <span key={i} className="font-extrabold text-indigo-600">{part}</span> : part
    );
  };

  const showHistory = isFocused && !term && recentSearches.length > 0;
  const showSuggestions = isFocused && term && (suggestions.length > 0 || suggestedCategories.length > 0);

  return (
    <div className={cn(
      "relative w-full transition-all duration-300 ease-out",
      isFocused ? "scale-[1.01]" : "scale-100"
    )}>
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
        {isSearching ? (
          <Loader2 className="h-5 w-5 text-indigo-600 animate-spin" />
        ) : (
          <Search className={cn("h-5 w-5 transition-colors", isFocused ? "text-indigo-600" : "text-gray-400")} />
        )}
      </div>
      <input
        ref={inputRef}
        type="text"
        className={cn(
          "block w-full border-0 py-3.5 pl-11 pr-10 text-gray-900 ring-1 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 shadow-sm transition-all",
          isFocused 
            ? "ring-indigo-600 bg-white shadow-md shadow-indigo-100" 
            : "ring-gray-200 bg-gray-50/50 hover:bg-white hover:ring-gray-300",
          // Si mostramos historial o sugerencias, quitamos el redondeo inferior
          (showHistory || showSuggestions) ? "rounded-t-2xl rounded-b-none" : "rounded-2xl"
        )}
        placeholder="Buscar por nombre, SKU, color..."
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        onFocus={() => setIsFocused(true)}
        // Retrasamos el blur para permitir clic en el historial
        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
        onKeyDown={handleKeyDown}
      />
      
      {/* Botón de Limpiar (Solo si hay texto) */}
      {term && (
        <button
          onClick={handleClear}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors animate-in fade-in zoom-in"
          type="button"
          aria-label="Borrar búsqueda"
        >
          <X className="h-5 w-5" />
        </button>
      )}

      {/* Menú de Historial */}
      {showHistory && (
        <div className="absolute top-full left-0 right-0 z-50 bg-white border border-t-0 border-gray-200 rounded-b-2xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-1">
          <div className="py-2">
            <p className="px-4 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Recientes</p>
            {recentSearches.map((item, index) => (
              <div 
                key={index}
                // onMouseDown previene que el input pierda foco antes del click
                onMouseDown={(e) => e.preventDefault()} 
                onClick={() => {
                  setTerm(item);
                  saveToHistory(item); // Mover al principio
                }}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 cursor-pointer group transition-colors"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <History className="h-4 w-4 text-gray-400 group-hover:text-indigo-500 transition-colors shrink-0" />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900 truncate">{item}</span>
                </div>
                <button 
                  onClick={(e) => removeFromHistory(e, item)}
                  className="p-1 rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                  title="Borrar del historial"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Menú de Sugerencias (Autocompletado) */}
      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 z-50 bg-white border border-t-0 border-gray-200 rounded-b-2xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-1">
          <div className="py-2">
            {/* Categorías Sugeridas */}
            {suggestedCategories.length > 0 && (
              <>
                <p className="px-4 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Categorías</p>
                {suggestedCategories.map((cat) => (
                  <Link 
                    key={cat}
                    href={`/tienda?category=${encodeURIComponent(cat)}`}
                    onClick={() => {
                      saveToHistory(term);
                      inputRef.current?.blur();
                    }}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 shrink-0">
                      <Tag className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">{highlightMatch(cat)}</span>
                  </Link>
                ))}
                {suggestions.length > 0 && <div className="my-2 border-t border-gray-100" />}
              </>
            )}

            {/* Productos Sugeridos */}
            {suggestions.length > 0 && (
              <>
                <p className="px-4 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Productos</p>
            {suggestions.map((product) => (
              <Link 
                key={product.id}
                href={`/producto/${product.id}`}
                onClick={() => {
                  saveToHistory(term); // Guardamos la búsqueda al hacer clic
                  // No necesitamos cerrar manualmente, la navegación lo hará
                }}
                className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors group"
              >
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                   <Image 
                     src={product.images?.[0] || product.imageUrl || ""} 
                     alt={product.name}
                     fill
                     className="object-cover"
                     sizes="40px"
                   />
                </div>
                <div className="flex-1 min-w-0">
                   <p className="text-sm font-medium text-gray-900 truncate group-hover:text-indigo-600 transition-colors">{highlightMatch(product.name)}</p>
                   <p className="text-xs text-gray-500 truncate">{product.category}</p>
                </div>
                <div className="text-sm font-bold text-gray-900 whitespace-nowrap">
                   {formatPrice(product.price)}
                </div>
              </Link>
            ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
