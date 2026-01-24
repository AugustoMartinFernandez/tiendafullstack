"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Product } from "@/lib/types";
import { validateFavorites } from "@/lib/actions";

interface FavoritesContextType {
  favorites: Product[];
  toggleFavorite: (product: Product) => void;
  isFavorite: (id: string) => boolean;
  clearFavorites: () => void;
  isLoaded: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const initFavorites = async () => {
      const saved = localStorage.getItem("favorites");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Si hay favoritos guardados, validamos con el servidor
          if (Array.isArray(parsed) && parsed.length > 0) {
            const ids = parsed.map((p: Product) => p.id);
            // Validamos contra Firebase (Server Action)
            const validProducts = await validateFavorites(ids);
            
            setFavorites(validProducts);
            // Actualizamos localStorage inmediatamente para eliminar los borrados
            localStorage.setItem("favorites", JSON.stringify(validProducts));
          }
        } catch (e) {
          console.error("Error loading favorites", e);
          setFavorites([]);
        }
      }
      setIsLoaded(true);
    };

    initFavorites();
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("favorites", JSON.stringify(favorites));
    }
  }, [favorites, isLoaded]);

  const toggleFavorite = (product: Product) => {
    setFavorites((prev) => {
      const exists = prev.find((p) => p.id === product.id);
      if (exists) {
        return prev.filter((p) => p.id !== product.id);
      }
      return [...prev, product];
    });
  };

  const isFavorite = (id: string) => {
    return favorites.some((p) => p.id === id);
  };

  const clearFavorites = () => {
    setFavorites([]);
  };

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite, clearFavorites, isLoaded }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
}