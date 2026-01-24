// src/app/(shop)/tienda/loading.tsx
import { ProductGridSkeleton } from "@/components/shop/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryFilter } from "@/components/shop/category-filter";

export default function ShopLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 min-h-[80vh]">
      <div className="flex flex-col gap-10">
        
        {/* SECCIÓN 1: CABECERA Y FILTROS SKELETON */}
        <section className="flex flex-col gap-6 border-b border-gray-100 pb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <Skeleton className="h-10 w-64 mb-2" /> {/* Título */}
              <Skeleton className="h-6 w-96" /> {/* Subtítulo */}
            </div>
            <div className="w-full md:w-auto md:min-w-[320px]">
              <Skeleton className="h-12 w-full rounded-xl" /> {/* Buscador */}
            </div>
          </div>
          
          {/* Filtros Skeleton */}
          <CategoryFilter isLoading />
        </section>

        {/* SECCIÓN 2: RESULTADOS SKELETON */}
        <section>
          {/* Barra de resultados skeleton */}
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-100">
             <Skeleton className="h-5 w-40" />
          </div>

          <ProductGridSkeleton count={12} />
        </section>
      </div>
    </div>
  );
}
