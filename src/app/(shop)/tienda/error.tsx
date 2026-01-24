// src/app/(shop)/tienda/error.tsx
"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Opcional: Registrar el error en un servicio de monitoreo
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
      <div className="flex flex-col items-center justify-center text-center border-2 border-dashed border-red-100 rounded-3xl bg-red-50/50 p-10 animate-in fade-in zoom-in-95">
        <div className="p-4 bg-white rounded-full mb-4 shadow-sm">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-xl font-black text-gray-900 mb-2">¡Ups! Algo salió mal.</h2>
        <p className="text-sm text-gray-600 mb-6 max-w-md">
          Tuvimos un problema técnico al cargar los productos. Por favor, intentá recargar la página.
        </p>
        <button
          onClick={() => reset()}
          className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200 active:scale-95"
        >
          Intentar de nuevo
        </button>
      </div>
    </div>
  );
}
