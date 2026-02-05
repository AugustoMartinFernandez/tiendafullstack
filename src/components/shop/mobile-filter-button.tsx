"use client";

import { useState, useEffect } from "react";
import { Filter, X } from "lucide-react";
import { ShopSidebar } from "@/components/shop/shop-sidebar";
import { cn } from "@/lib/utils";

interface MobileFilterButtonProps {
  categories: string[];
}

export function MobileFilterButton({ categories }: MobileFilterButtonProps) {
  const [open, setOpen] = useState(false);
  const [isMounting, setIsMounting] = useState(false);

  // Efecto para animar la entrada
  useEffect(() => {
    if (open) {
      setIsMounting(true);
      // Bloquear scroll del body cuando el modal está abierto
      document.body.style.overflow = "hidden";
    } else {
      const timer = setTimeout(() => setIsMounting(false), 300); // Esperar animación
      document.body.style.overflow = "unset";
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Cerrar al cambiar de ruta o completar una acción
  const handleClose = () => setOpen(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 transition-colors shadow-sm"
      >
        <Filter className="w-4 h-4" />
        <span className="text-sm font-bold">Filtrar</span>
      </button>

      {/* Portal del Modal (Drawer) */}
      {(open || isMounting) && (
        <div className={cn(
          "fixed inset-0 z-[100] flex justify-end transition-opacity duration-300",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}>
          
          {/* Backdrop Oscuro */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Panel Lateral Deslizante */}
          <div className={cn(
            "relative w-full max-w-xs bg-white shadow-2xl h-full flex flex-col transition-transform duration-300 ease-out transform",
            open ? "translate-x-0" : "translate-x-full"
          )}>
            
            {/* Cabecera del Modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-black text-gray-900">Filtros</h2>
              <button
                onClick={handleClose}
                className="p-2 -mr-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              <ShopSidebar 
                categories={categories} 
                onClose={handleClose} 
              />
            </div>

            {/* Pie del Modal (Opcional: Botón ver resultados) */}
            <div className="p-4 border-t border-gray-100 bg-gray-50">
              <button
                onClick={handleClose}
                className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors"
              >
                Ver Resultados
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}