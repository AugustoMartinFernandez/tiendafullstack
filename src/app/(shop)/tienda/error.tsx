"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Registrar el error en consola para debugging
    console.error("Error capturado en la tienda:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-white py-12">
      <div className="max-w-lg w-full text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Icono Principal con Halo */}
        <div className="relative mx-auto w-24 h-24">
           <div className="absolute inset-0 bg-red-100 rounded-full animate-pulse opacity-50"></div>
           <div className="relative flex h-full w-full items-center justify-center rounded-full bg-red-50 border border-red-100">
             <AlertTriangle className="h-10 w-10 text-red-600" />
           </div>
        </div>

        {/* Textos Informativos */}
        <div className="space-y-3">
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">
            ¡Ups! Algo salió mal
          </h2>
          <p className="text-base text-gray-500 font-medium max-w-md mx-auto leading-relaxed">
            Tuvimos un problema técnico al cargar el catálogo. Por favor, intentá recargar la página en unos segundos.
          </p>
          
          {/* Mensaje técnico solo visible en desarrollo para ayudarte a ti */}
          {process.env.NODE_ENV === "development" && (
            <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg text-left overflow-hidden">
               <p className="text-xs font-mono text-red-600 font-bold mb-1">Error Técnico:</p>
               <p className="text-xs font-mono text-gray-700 break-words">{error.message}</p>
            </div>
          )}
        </div>

        {/* Botones de Acción */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-200 active:scale-95 group"
          >
            <RefreshCw className="w-4 h-4 transition-transform group-hover:rotate-180" />
            Intentar de nuevo
          </button>
          
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-white border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 hover:text-gray-900 transition-all active:scale-95"
          >
            <Home className="w-4 h-4" />
            Volver al Inicio
          </Link>
        </div>
      </div>
    </div>
  );
}