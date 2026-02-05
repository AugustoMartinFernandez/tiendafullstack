import { getStoreProducts } from "@/lib/actions/products";
import { ProductCard } from "@/components/shop/product-card";
import { Pagination } from "@/components/shop/pagination";
import { Info, Tag } from "lucide-react"; // Agregamos Tag para el icono de ofertas

interface ProductGridProps {
  searchParams?: { [key: string]: string | string[] | undefined };
  forceOffers?: boolean; // 👈 Prop nueva para activar modo ofertas
}

export async function ProductGrid({ searchParams, forceOffers = false }: ProductGridProps) {
  // 1. Extraemos y limpiamos los filtros de la URL
  const category = typeof searchParams?.category === "string" ? searchParams.category : undefined;
  const subCategory = typeof searchParams?.subCategory === "string" ? searchParams.subCategory : undefined;
  const tag = typeof searchParams?.tag === "string" ? searchParams.tag : undefined;
  const search = typeof searchParams?.search === "string" ? searchParams.search : undefined;
  const minPrice = typeof searchParams?.min === "string" ? Number(searchParams.min) : undefined;
  const maxPrice = typeof searchParams?.max === "string" ? Number(searchParams.max) : undefined;
  const page = typeof searchParams?.page === "string" ? Number(searchParams.page) : 1;

  // 2. Buscamos los productos en el servidor (Cached)
  const products = await getStoreProducts({
    category,
    subCategory,
    tag,
    search,
    minPrice,
    maxPrice,
    limitCount: 200, // Traemos hasta 200 productos para paginar en memoria
    onlyOffers: forceOffers, // 👈 Pasamos el filtro al servidor
  });

  // 3. Paginación en Memoria
  const ITEMS_PER_PAGE = 12;
  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
  const start = (page - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const currentProducts = products.slice(start, end);

  // 4. Estado Vacío (Personalizado para ofertas)
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center border-2 border-dashed border-gray-100 rounded-3xl bg-gray-50/50">
        <div className="bg-white p-4 rounded-full shadow-sm mb-4">
          {/* Icono dinámico: Rojo si es ofertas, Gris si es normal */}
          {forceOffers ? (
            <Tag className="w-8 h-8 text-red-500" />
          ) : (
            <Info className="w-8 h-8 text-gray-400" />
          )}
        </div>
        <h3 className="text-lg font-bold text-gray-900">
          {forceOffers ? "No hay ofertas activas por ahora" : "No encontramos productos"}
        </h3>
        <p className="text-gray-500 mt-2 max-w-md mx-auto">
          {forceOffers 
            ? "¡Vuelve pronto! Estamos preparando nuevos descuentos." 
            : "Intenta ajustar los filtros de precio o categoría, o busca con otros términos."}
        </p>
      </div>
    );
  }

  // 5. Renderizado del Grid
  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {currentProducts.map((product) => (
          <ProductCard 
            key={product.id} 
            product={product} 
            highlight={search} // Resaltamos el texto si hay búsqueda
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="border-t border-gray-100 pt-8">
          <Pagination totalPages={totalPages} />
        </div>
      )}
    </div>
  );
}