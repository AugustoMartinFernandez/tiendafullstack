import { Skeleton } from "@/components/ui/skeleton";

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
      {/* Imagen (Aspect Square) */}
      <div className="aspect-square w-full bg-gray-50">
        <Skeleton className="h-full w-full rounded-none" />
      </div>

      {/* Contenido */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {/* Categoría y Subcategoría */}
        <div className="mb-3 flex items-center gap-2">
          <Skeleton className="h-3 w-20 rounded-full" />
          <Skeleton className="h-3 w-12 rounded-full" />
        </div>

        {/* Título (Simulando 2 líneas) */}
        <div className="mb-4 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>

        {/* SKU */}
        <Skeleton className="mb-4 h-3 w-24" />

        {/* Espaciador para empujar el precio abajo (mt-auto) */}
        <div className="mt-auto">
          {/* Precio */}
          <div className="flex flex-col gap-1">
             <Skeleton className="h-3 w-16" /> {/* Precio original tachado */}
             <Skeleton className="h-6 w-32" /> {/* Precio actual */}
          </div>

          {/* Barra de Stock */}
          <div className="mt-3">
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>

          {/* Botón Móvil (Visible solo en mobile, igual que ProductCard) */}
          <div className="mt-4 sm:hidden">
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}