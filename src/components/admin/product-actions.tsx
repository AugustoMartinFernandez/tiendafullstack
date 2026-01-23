"use client";

import { MoreHorizontal, Trash2, Copy, Eye, EyeOff, Edit } from "lucide-react";
import { useState } from "react";
import { deleteProduct, duplicateProduct, toggleProductVisibility } from "@/lib/actions";

interface ProductActionsProps {
  id: string;
  isVisible: boolean;
}

export function ProductActions({ id, isVisible }: ProductActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Helper para ejecutar acciones sin recargar toda la página visualmente
  const handleAction = async (action: any, formData: FormData) => {
    setLoading(true);
    setIsOpen(false); // Cerramos menú
    await action(formData);
    setLoading(false);
  };

  return (
    <div className="relative">
      {/* Botón de 3 puntitos */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-full transition-colors"
      >
        <MoreHorizontal className="h-5 w-5" />
      </button>

      {/* Menú Desplegable */}
      {isOpen && (
        <>
          {/* Fondo invisible para cerrar al hacer clic afuera */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          
          <div className="absolute right-0 top-8 z-50 w-48 rounded-xl border border-gray-100 bg-white py-1 shadow-xl ring-1 ring-black ring-opacity-5 animate-in fade-in zoom-in-95 duration-100">
            
            {/* DUPLICAR */}
            <form action={(fd) => handleAction(duplicateProduct, fd)}>
              <input type="hidden" name="id" value={id} />
              <button className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                <Copy className="mr-3 h-4 w-4 text-gray-400" /> Duplicar
              </button>
            </form>

            {/* OCULTAR / MOSTRAR */}
            <form action={(fd) => handleAction(toggleProductVisibility, fd)}>
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="currentStatus" value={String(isVisible)} />
              <button className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                {isVisible ? (
                  <>
                    <EyeOff className="mr-3 h-4 w-4 text-amber-500" /> Ocultar
                  </>
                ) : (
                  <>
                    <Eye className="mr-3 h-4 w-4 text-green-500" /> Publicar
                  </>
                )}
              </button>
            </form>

            {/* EDITAR (Link simple) */}
            <a href={`/admin/productos/editar/${id}`} className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
               <Edit className="mr-3 h-4 w-4 text-blue-500" /> Editar (Pronto)
            </a>

            <div className="my-1 border-t border-gray-100" />

            {/* BORRAR */}
            <form action={(fd) => handleAction(deleteProduct, fd)}>
              <input type="hidden" name="id" value={id} />
              <button className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                <Trash2 className="mr-3 h-4 w-4" /> Eliminar
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}