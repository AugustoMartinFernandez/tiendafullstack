import { Skeleton } from "@/components/ui/skeleton";
import { ProductGridSkeleton } from "@/components/shop/skeletons";

export default function ShopRootLoading() {
  return (
    <div className="animate-pulse">
      {/* Hero Skeleton (Simula el banner principal) */}
      <div className="relative h-[500px] w-full bg-gray-100 mb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center">
          <Skeleton className="h-12 w-2/3 max-w-xl mb-4 bg-gray-200" />
          <Skeleton className="h-6 w-1/2 max-w-lg mb-8 bg-gray-200" />
          <Skeleton className="h-12 w-40 rounded-full bg-gray-200" />
        </div>
      </div>

      {/* Content Skeleton (Simula productos destacados) */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
           <Skeleton className="h-8 w-48" /> {/* Título de sección */}
        </div>
        
        <ProductGridSkeleton count={4} />
      </div>
    </div>
  );
}