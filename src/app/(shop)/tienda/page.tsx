import { getStoreProducts } from "@/lib/actions/products";
import { getCategories, getTags } from "@/lib/actions/settings";
import { ProductCard } from "@/components/shop/product-card";
import { ProductFilters } from "@/components/shop/product-filters";
import { CategoryFilter } from "@/components/shop/category-filter";
import { Pagination } from "@/components/shop/pagination";
import { ShoppingBag } from "lucide-react";
import { Product } from "@/lib/types";

export const revalidate = 60; // Revalida el caché de esta página cada 60 segundos

export default async function TiendaPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // 1. Parsear parámetros de la URL para filtros
  const params = await searchParams;
  const page = params.page ? Number(params.page) : 1;
  const minPrice = params.min ? Number(params.min) : undefined;
  const maxPrice = params.max ? Number(params.max) : undefined;
  const category = typeof params.category === "string" ? params.category : undefined;
  const subCategory = typeof params.subCategory === "string" ? params.subCategory : undefined;
  const ITEMS_PER_PAGE = 12;

  // 2. Obtener datos usando las Server Actions robustas que ya creamos
  // Esto centraliza la lógica y aprovecha el "Plan B" para índices faltantes.
  const allFilteredProducts: Product[] = await getStoreProducts({
    category,
    subCategory,
    minPrice,
    maxPrice,
  });

  const allCategories = await getCategories();

  // 3. Aplicar paginación en el servidor a los datos ya filtrados
  const totalItems = allFilteredProducts.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const paginatedProducts = allFilteredProducts.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-black tracking-tight text-gray-900">
            Nuestra Tienda
          </h1>
          <p className="mt-4 text-base text-gray-500 max-w-2xl">
            Explorá nuestra colección de productos.
          </p>
        </div>
      </div>

      {/* Filtros de Categoría */}
      <div className="sticky top-15 md:top-18 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <CategoryFilter 
            allCategories={allCategories}
            currentCategory={category}
            currentSubCategory={subCategory}
          />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Barra de Herramientas */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
          <span className="text-sm font-medium text-gray-500">
            {totalItems} productos encontrados
          </span>
          <ProductFilters />
        </div>

        {/* Grilla de Productos */}
        {paginatedProducts.length > 0 ? (
          <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {paginatedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="rounded-full bg-gray-100 p-6 mb-4">
              <ShoppingBag className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No se encontraron productos</h3>
            <p className="text-gray-500 mt-2">Intenta limpiar los filtros o vuelve a cargar la página.</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-12"><Pagination totalPages={totalPages} /></div>
        )}
      </div>
    </div>
  );
}
