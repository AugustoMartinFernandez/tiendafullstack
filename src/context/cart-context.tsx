"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Product } from "@/lib/types";

export interface CartItem extends Product {
  quantity: number;
}

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
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // 1. Cargar del localStorage al iniciar (solo en el cliente)
  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error("Error al cargar el carrito:", error);
      }
    }
    setIsLoaded(true);
  }, []);

  // 2. Guardar en localStorage cada vez que cambia el carrito
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("cart", JSON.stringify(items));
    }
  }, [items, isLoaded]);

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
