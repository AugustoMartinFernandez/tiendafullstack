"use client";

import { useEffect, useRef, Dispatch, SetStateAction } from "react";
import { useDebouncedCallback } from "use-debounce";
import { useAuth } from "@/context/auth-context";
import { getUserCart, saveUserCart, mergeCarts } from "@/lib/cart-service";
import { CartItem } from "@/lib/types";

export function useCartSync(
  items: CartItem[],
  setItems: Dispatch<SetStateAction<CartItem[]>>,
  isLoaded: boolean
) {
  const { user, loading: authLoading } = useAuth();
  const prevUserRef = useRef<string | null>(null);

  // 1. Sincronización Inteligente (Login/Logout)
  useEffect(() => {
    if (authLoading || !isLoaded) return;

    const currentUserId = user?.uid || null;
    const prevUserId = prevUserRef.current;

    // Caso A: Usuario inicia sesión -> Fusionar carritos
    if (currentUserId && currentUserId !== prevUserId) {
      const syncCarts = async () => {
        try {
          const remoteCart = await getUserCart(currentUserId);
          const localCart = items; // Usamos el estado actual del closure
          
          if (remoteCart.length > 0 || localCart.length > 0) {
            const mergedCart = mergeCarts(localCart, remoteCart);
            setItems(mergedCart);
          }
        } catch (error) {
          console.error("Error syncing cart:", error);
        }
      };
      syncCarts();
    }

    // Caso B: Usuario cierra sesión -> Limpiar carrito local
    if (prevUserId && !currentUserId) {
      setItems([]);
      localStorage.removeItem("cart");
    }

    prevUserRef.current = currentUserId;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, isLoaded]);

  // 2. Persistencia Automática (Firestore Debounced + LocalStorage)
  const debouncedSaveCart = useDebouncedCallback(
    async (userId: string, cartItems: CartItem[]) => {
      try {
        await saveUserCart(userId, cartItems);
      } catch (error) {
        console.error("Error saving cart to Firestore:", error);
      }
    },
    1500
  );

  useEffect(() => {
    if (!isLoaded) return;

    // Siempre mantener LocalStorage actualizado
    localStorage.setItem("cart", JSON.stringify(items));

    // Si hay usuario, sincronizar con la nube en segundo plano
    if (user) {
      debouncedSaveCart(user.uid, items);
    }
  }, [items, isLoaded, user, debouncedSaveCart]);
}
