// src/components/shop/cart-widget.tsx
"use client";

import { ShoppingBag } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function CartWidget() {
  const { openCart, totalItems } = useCart();
  const [mounted, setMounted] = useState(false);
  const [bump, setBump] = useState(false);

  // Evita el error de hidratación asegurando que el componente se renderice
  // igual en el servidor y en el cliente en el primer render.
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (totalItems > 0) {
      const raf = requestAnimationFrame(() => setBump(true));
      const timer = setTimeout(() => setBump(false), 300);
      return () => { cancelAnimationFrame(raf); clearTimeout(timer); };
    }
  }, [totalItems]);

  return (
    <button
      onClick={openCart}
      className="relative p-2 text-gray-700 hover:text-indigo-600 transition-colors group"
      aria-label={`Carrito de compras con ${mounted ? totalItems : 0} productos`}
    >
      <ShoppingBag className="h-6 w-6 group-hover:scale-110 transition-transform" />
      
      {mounted && totalItems > 0 && (
        <span 
          className={cn(
            "absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white shadow-sm",
            bump ? "scale-125" : "scale-100",
            "transition-transform duration-300 ease-out"
          )}
        >
          {totalItems}
        </span>
      )}
    </button>
  );
}
