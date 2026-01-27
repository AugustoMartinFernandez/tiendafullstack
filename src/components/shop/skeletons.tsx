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

export function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Profile Card Skeleton */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex flex-col md:flex-row items-center gap-8">
          <Skeleton className="h-24 w-24 rounded-full shrink-0" />
          <div className="flex-1 space-y-4 w-full text-center md:text-left">
            <Skeleton className="h-8 w-48 mx-auto md:mx-0" />
            <Skeleton className="h-4 w-32 mx-auto md:mx-0" />
            <Skeleton className="h-4 w-40 mx-auto md:mx-0" />
          </div>
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>

        {/* Quick Access Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>

        {/* Orders Skeleton */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-50">
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="p-6 space-y-4">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function CheckoutSuccessSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 py-12">
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-lg border border-gray-100 max-w-lg w-full">
        {/* Header */}
        <div className="text-center">
          <Skeleton className="w-20 h-20 rounded-full mx-auto mb-4" />
          <Skeleton className="h-8 w-3/4 mx-auto mb-2" />
          <Skeleton className="h-4 w-full max-w-xs mx-auto mb-8" />
        </div>
        {/* Order Summary */}
        <div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden mb-8">
          <div className="p-4 border-b border-gray-100">
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="p-4 space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-start gap-4">
                <Skeleton className="h-16 w-16 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </div>
          <div className="bg-gray-100/50 p-4 border-t border-gray-200">
            <Skeleton className="h-6 w-1/2 ml-auto" />
          </div>
        </div>
        {/* Action Buttons */}
        <div className="space-y-3">
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function OrderCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-7 w-24 rounded-full" />
      </div>
      <div className="p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-5 w-20" />
        </div>
      </div>
      <div className="mt-6 pt-4 border-t border-gray-100 p-4 sm:p-6 flex justify-between items-center">
        <Skeleton className="h-10 w-32 rounded-lg" />
        <Skeleton className="h-6 w-40" />
      </div>
    </div>
  );
}

export function MisPedidosPageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
        <div className="grid gap-6">
          <OrderCardSkeleton />
          <OrderCardSkeleton />
        </div>
      </div>
    </div>
  );
}