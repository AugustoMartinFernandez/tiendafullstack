"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import { useDebouncedCallback } from "use-debounce";
import { Product, CartItem } from "@/lib/types";
import { useAuth } from "./auth-context";
import { getUserCart, saveUserCart, mergeCarts } from "@/lib/cart-service";

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  totalItems: number;
  totalPrice: number;
  isLoaded: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const prevUserRef = useRef<string | null>(null);

  // 1. Cargar del localStorage al iniciar en el cliente para evitar hydration errors
  useEffect(() => {
    try {
      const saved = localStorage.getItem("cart");
      if (saved) {
        const parsedItems = JSON.parse(saved);
        if (Array.isArray(parsedItems)) {
          setItems(parsedItems);
        }
      }
    } catch (e) {
      console.error("Failed to load cart from localStorage", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);
  
  // 2. Sincronizar con Firestore al iniciar sesión Y limpiar al cerrar sesión
  useEffect(() => {
    if (authLoading || !isLoaded) return;

    const currentUserId = user?.uid || null;
    const prevUserId = prevUserRef.current;

    // Caso 1: Login (o carga inicial con sesión) - Sincronizar
    if (currentUserId && currentUserId !== prevUserId) {
      const syncCarts = async () => {
        const remoteCart = await getUserCart(currentUserId);
        const localCart = items;
        if (remoteCart.length > 0 || localCart.length > 0) {
          const mergedCart = mergeCarts(localCart, remoteCart);
          setItems(mergedCart);
        }
      };
      syncCarts();
    }

    // Caso 2: Logout - Limpiar carrito
    if (prevUserId && !currentUserId) {
      setItems([]);
      localStorage.removeItem("cart");
    }

    prevUserRef.current = currentUserId;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, isLoaded]);

  // 3. Debounce para guardar en Firestore y no sobrecargarlo en cada cambio
  const debouncedSaveCart = useDebouncedCallback(
    async (userId: string, cartItems: CartItem[]) => {
      try {
        await saveUserCart(userId, cartItems);
      } catch (error) {
        console.error("Error al guardar el carrito en Firestore:", error);
      }
    },
    1500 // Espera 1.5 segundos después del último cambio para guardar
  );

  // 4. Guardar en localStorage (y Firestore si está logueado) cada vez que cambia el carrito
  useEffect(() => {
    if (isLoaded) {
      // Siempre guarda en localStorage para acceso offline y para invitados
      localStorage.setItem("cart", JSON.stringify(items));

      // Si el usuario está logueado, también guarda en Firestore
      if (user) {
        debouncedSaveCart(user.uid, items);
      }
    }
  }, [items, isLoaded, user, debouncedSaveCart]);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const addToCart = (product: Product) => {
    setItems((prev) => {
      const existingItem = prev.find((item) => item.id === product.id);
      if (existingItem) {
        // Si ya existe, aumentamos la cantidad
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      // Si no existe, lo agregamos con cantidad 1
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true); // Abrir carrito automáticamente al agregar
  };

  const removeFromCart = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(id);
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        isCartOpen,
        openCart,
        closeCart,
        isLoaded,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart debe usarse dentro de un CartProvider");
  }
  return context;
}
