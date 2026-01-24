// src/app/(shop)/producto/[id]/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb Skeleton */}
      <div className="mb-6">
        <Skeleton className="h-5 w-32" />
      </div>

      <div className="lg:grid lg:grid-cols-2 lg:gap-x-12 xl:gap-x-16">
        {/* COLUMNA IZQUIERDA: GALERÍA */}
        <div className="mb-10 lg:mb-0">
          {/* Imagen Principal */}
          <Skeleton className="aspect-square w-full rounded-3xl" />
          
          {/* Miniaturas */}
          <div className="mt-6 grid grid-cols-4 gap-4 sm:grid-cols-5">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        </div>

        {/* COLUMNA DERECHA: INFO */}
        <div className="flex flex-col">
          
          {/* Categoría */}
          <div className="mb-3 flex items-center gap-2">
            <Skeleton className="h-6 w-20 rounded-md" />
            <Skeleton className="h-6 w-16 rounded-md" />
          </div>

          {/* Título */}
          <Skeleton className="h-10 w-3/4 mb-4" />

          {/* Precio */}
          <Skeleton className="h-8 w-32 mb-6" />

          {/* Botones de Acción */}
          <div className="flex flex-col gap-4 mb-8">
            <Skeleton className="h-14 w-full rounded-full" /> {/* Botón Comprar */}
            <div className="flex gap-3">
              <Skeleton className="h-12 flex-1 rounded-full" /> {/* Botón Compartir */}
              <Skeleton className="h-12 w-12 rounded-full" /> {/* Botón Favorito */}
            </div>
          </div>

          {/* Descripción (Líneas de texto) */}
          <div className="space-y-2 mb-8">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>

          {/* Specs / Garantías */}
          <div className="border-t border-gray-100 pt-8">
             <Skeleton className="h-5 w-32 mb-4" />
             <div className="grid grid-cols-2 gap-4">
               <Skeleton className="h-12 rounded-xl" />
               <Skeleton className="h-12 rounded-xl" />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
