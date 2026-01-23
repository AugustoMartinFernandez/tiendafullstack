"use client";

import { useState } from "react";
import { ShoppingBag, Check } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { Product } from "@/lib/types";

export function AddToCart({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  const handleAdd = () => {
    addToCart(product);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <button 
      onClick={handleAdd}
      disabled={isAdded}
      className={`flex w-full items-center justify-center rounded-full px-8 py-4 text-base font-bold text-white shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] ${isAdded ? "bg-green-600 hover:bg-green-700" : "bg-indigo-600 hover:bg-indigo-700"}`}
    >
      {isAdded ? <Check className="mr-2 h-5 w-5" /> : <ShoppingBag className="mr-2 h-5 w-5" />}
      {isAdded ? "¡Agregado!" : "Agregar al carrito"}
    </button>
  );
}
