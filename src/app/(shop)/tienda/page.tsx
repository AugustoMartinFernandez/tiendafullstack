// src/app/(shop)/tienda/page.tsx
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { Product } from "@/lib/types";
import { ProductCard } from "@/components/shop/product-card";
import { ShoppingBag } from "lucide-react";
import { ProductFilters } from "@/components/shop/product-filters";
import { CategoryFilter } from "@/components/shop/category-filter"; // Nuevo componente
import { Pagination } from "@/components/shop/pagination";

// Revalidación Incremental (ISR): Actualiza la tienda cada 60 segundos si hay visitas
export const revalidate = 60;

async function getProducts(min: number | null, max: number | null, category?: string, subCategory?: string) {
  try {
    // Traemos solo productos visibles y ordenados por fecha
    const productsRef = collection(db, "products");
    const q = query(
      productsRef, 
      where("isVisible", "==", true),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    let products = querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    })) as Product[];

    // Filtrado en memoria (más flexible y robusto para rangos sin índices complejos)
    if (min !== null) products = products.filter(p => p.price >= min);
    if (max !== null) products = products.filter(p => p.price <= max);
    if (category) products = products.filter(p => p.category === category);
    if (subCategory) products = products.filter(p => p.subCategory === subCategory);

    return products;
  } catch (error) {
    console.error("Error cargando productos:", error);
    // Fallback seguro en caso de error (ej: falta de índice compuesto)
    const querySnapshot = await getDocs(collection(db, "products"));
    let products = querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Product))
      .filter(p => p.isVisible !== false);
      
    if (min !== null) products = products.filter(p => p.price >= min);
    if (max !== null) products = products.filter(p => p.price <= max);
    if (category) products = products.filter(p => p.category === category);
    if (subCategory) products = products.filter(p => p.subCategory === subCategory);
    
    return products;
  }
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ min?: string, max?: string, category?: string, subCategory?: string, page?: string }> }) {
  const { min, max, category, subCategory, page } = await searchParams;
  const minPrice = min ? Number(min) : null;
  const maxPrice = max ? Number(max) : null;
  const currentPage = page ? Number(page) : 1;
  const ITEMS_PER_PAGE = 12;

  const allFilteredProducts = await getProducts(minPrice, maxPrice, category, subCategory);
  
  // Lógica de Paginación
  const totalItems = allFilteredProducts.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const paginatedProducts = allFilteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  
  // Obtenemos todas las categorías disponibles para el filtro (podría optimizarse)
  const allProducts = await getProducts(null, null); 

  return (
    <div className="min-h-screen bg-white">
      {/* --- HEADER DE LA TIENDA --- */}
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
            Nuestra Colección
          </h1>
          <p className="mt-4 text-base text-gray-500 max-w-2xl">
            Explorá nuestros productos seleccionados con la calidad y tradición de Doña Jovita.
          </p>
        </div>
      </div>

      {/* --- NAVEGACIÓN DE CATEGORÍAS --- */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <CategoryFilter products={allProducts} currentCategory={category} currentSubCategory={subCategory} />
        </div>
      </div>

      {/* --- CONTENIDO PRINCIPAL --- */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
        {/* Barra de Herramientas (Filtros / Cantidad) */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
          <span className="text-sm font-medium text-gray-500">
            {totalItems} productos encontrados
          </span>
          <ProductFilters />
        </div>

        {/* --- GRILLA DE PRODUCTOS --- */}
        {paginatedProducts.length > 0 ? (
          <div className="grid grid-cols-1 gap-y-8 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {paginatedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          // Estado Vacío
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="rounded-full bg-gray-50 p-6 mb-4">
              <ShoppingBag className="h-10 w-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No hay productos disponibles</h3>
            <p className="text-gray-500 mt-2">Volvé a intentar más tarde.</p>
          </div>
        )}

        {/* --- PAGINACIÓN --- */}
        <Pagination totalPages={totalPages} />
      </div>
    </div>
  );
}
