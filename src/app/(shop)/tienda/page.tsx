// src/app/(shop)/tienda/page.tsx
import { getStoreProducts } from "@/lib/actions";
import { ProductCard } from "@/components/shop/product-card";
import { CategoryFilter } from "@/components/shop/category-filter";
import { X, SearchX } from "lucide-react";
import Link from "next/link";
import { SearchInput } from "@/components/shop/search-input";
export const dynamic = 'force-dynamic';
export const revalidate = 0; // Forzar actualización dinámica

export const metadata = {
  title: "Tienda | Doña Jovita",
  description: "Explorá nuestros productos artesanales.",
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;
  const category = typeof params.category === "string" ? params.category : undefined;
  const subCategory = typeof params.subCategory === "string" ? params.subCategory : undefined;
  const tag = typeof params.tag === "string" ? params.tag : undefined;
  const search = typeof params.search === "string" ? params.search : undefined;

  // 1. Obtener productos filtrados desde el servidor
  const products = await getStoreProducts({ category, subCategory, tag, search });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 animate-in fade-in duration-700 min-h-[80vh]">
      <div className="flex flex-col gap-10">
        
        {/* SECCIÓN 1: CABECERA Y FILTROS */}
        <section className="flex flex-col gap-6 border-b border-gray-100 pb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-4xl font-black text-gray-900 tracking-tight">Nuestra Tienda</h1>
              <p className="text-gray-500 mt-2 text-lg">Explorá nuestra colección de productos artesanales.</p>
            </div>
            <div className="w-full md:w-auto md:min-w-[320px]">
              <SearchInput />
            </div>
          </div>
          
          {/* Filtro de Categorías */}
          <CategoryFilter 
            products={products} 
            currentCategory={category}
            currentSubCategory={subCategory}
          />

          {/* Chip de Tag Activo */}
          {tag && (
            <div className="mt-4 flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
              <span className="text-sm font-medium text-gray-500">Filtrado por etiqueta:</span>
              <Link 
                href="/tienda" 
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold hover:bg-indigo-200 transition-colors"
              >
                #{tag} <X className="h-3 w-3" />
              </Link>
            </div>
          )}
        </section>

        {/* SECCIÓN 2: RESULTADOS */}
        <section>
          {products.length > 0 ? (
            <>
              {/* Barra de Resultados */}
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-100">
                <p className="text-sm text-gray-500">
                  Mostrando <span className="font-bold text-gray-900">{products.length}</span> productos
                </p>
                {/* Aquí podrías agregar un Dropdown de "Ordenar por" en el futuro */}
              </div>

              <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} highlight={search} />
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-gray-100 rounded-3xl bg-gray-50/50">
              <div className="p-4 bg-white rounded-full mb-4 shadow-sm">
                 <SearchX className="h-8 w-8 text-gray-400" />
              </div>
              
              {search ? (
                <>
                  <p className="text-lg font-bold text-gray-900">
                    No encontramos resultados para &quot;{search}&quot;
                  </p>
                  <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto">
                    Intentá con términos más generales o revisá la ortografía.
                  </p>
                </>
              ) : (
                <p className="text-lg font-medium text-gray-500">No hay productos que coincidan con los filtros.</p>
              )}
              
              <Link 
                href="/tienda" 
                className="mt-6 inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-gray-900 text-white font-bold hover:bg-indigo-600 transition-colors"
              >
                Limpiar filtros
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
