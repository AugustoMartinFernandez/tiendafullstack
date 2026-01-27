"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import { Product } from "@/lib/types";
import { validateFavorites } from "@/lib/actions/products";
import { useAuth } from "./auth-context";
import { useDebouncedCallback } from "use-debounce";
import { getUserFavorites, saveUserFavorites, mergeFavorites } from "@/lib/favorites-service";

interface FavoritesContextType {
  favorites: Product[];
  toggleFavorite: (product: Product) => void;
  isFavorite: (id: string) => boolean;
  clearFavorites: () => void;
  isLoaded: boolean;
  recentlyAddedId: string | null;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();
  const prevUserRef = useRef<string | null>(null);

  // 1. Cargar desde localStorage en el renderizado inicial del cliente
  useEffect(() => {
    try {
      const saved = localStorage.getItem("favorites");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setFavorites(parsed);
        }
      }
    } catch (e) {
      console.error("Error al cargar favoritos desde localStorage", e);
    }
    setIsLoaded(true);
  }, []);

  // 2. Sincronizar con Firestore al iniciar sesión Y limpiar al cerrar sesión
  useEffect(() => {
    if (authLoading || !isLoaded) return;

    const currentUserId = user?.uid || null;
    const prevUserId = prevUserRef.current;

    // Caso 1: Login (o carga inicial con sesión) - Sincronizar
    if (currentUserId && currentUserId !== prevUserId) {
      const syncFavorites = async () => {
        const remoteFavorites = await getUserFavorites(currentUserId);
        const localFavorites = favorites;

        const merged = mergeFavorites(localFavorites, remoteFavorites);

        if (merged.length > 0) {
          const ids = merged.map((p) => p.id);
          const validFavorites = await validateFavorites(ids);
          setFavorites(validFavorites);
        } else {
          setFavorites([]);
        }
      };
      syncFavorites();
    }

    // Caso 2: Logout - Limpiar favoritos
    if (prevUserId && !currentUserId) {
      setFavorites([]);
      localStorage.removeItem("favorites");
    }

    prevUserRef.current = currentUserId;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, isLoaded]);

  // 3. Debounce para guardar en Firestore y no sobrecargarlo
  const debouncedSaveFavorites = useDebouncedCallback(
    async (userId: string, favItems: Product[]) => {
      try {
        await saveUserFavorites(userId, favItems);
      } catch (error) {
        console.error("Error al guardar favoritos en Firestore:", error);
      }
    },
    1500 // 1.5s de espera
  );

  // 4. Persistir cambios en localStorage y (si está logueado) en Firestore
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("favorites", JSON.stringify(favorites));
      if (user) {
        debouncedSaveFavorites(user.uid, favorites);
      }
    }
  }, [favorites, isLoaded, user, debouncedSaveFavorites]);

  const toggleFavorite = (product: Product) => {
    const exists = favorites.some((p) => p.id === product.id);

    if (exists) {
      setFavorites((prev) => prev.filter((p) => p.id !== product.id));
    } else {
      setFavorites((prev) => [...prev, product]);
      setRecentlyAddedId(product.id);
      setTimeout(() => setRecentlyAddedId(null), 1000); // La animación durará 1 segundo
    }
  };

  const isFavorite = (id: string) => {
    return favorites.some((p) => p.id === id);
  };

  const clearFavorites = () => {
    setFavorites([]);
  };

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite, clearFavorites, isLoaded, recentlyAddedId }}>
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