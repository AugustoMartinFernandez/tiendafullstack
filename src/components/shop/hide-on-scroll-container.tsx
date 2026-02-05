"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export function HideOnScrollContainer({ children }: { children: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Lógica de histéresis:
      // - Mostrar si subimos (current < last) o estamos muy arriba (< 100px)
      // - Ocultar si bajamos (current > last) y ya pasamos el header (> 100px)
      if (currentScrollY < lastScrollY.current || currentScrollY < 100) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsVisible(false);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div 
      className={cn(
        // Estilos Base (Móvil First - Sticky & Layout)
        "sticky top-[60px] z-40 -mx-4 px-4 py-3 mb-8 flex flex-col gap-4",
        "bg-white/90 backdrop-blur-md shadow-sm",
        
        // Animación de Entrada/Salida
        "transition-all duration-300 ease-in-out",
        isVisible ? "translate-y-0 opacity-100" : "-translate-y-[150%] opacity-0 pointer-events-none",

        // Desktop (Reset a estático y siempre visible)
        "lg:static lg:bg-transparent lg:shadow-none lg:mx-0 lg:px-0 lg:mb-12 lg:border-b lg:border-gray-100 lg:pb-6 lg:flex-row lg:items-center lg:justify-between lg:transform-none lg:opacity-100 lg:pointer-events-auto"
      )}
    >
      {children}
    </div>
  );
}