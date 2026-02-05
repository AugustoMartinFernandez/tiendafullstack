import { Suspense } from "react";
import { getCategories, getShopBanner } from "@/lib/actions/settings"; // 👈 1. Importamos getShopBanner
import { ShopSidebar } from "@/components/shop/shop-sidebar";
import { ProductGrid } from "@/components/shop/product-grid";
import { MobileFilterButton } from "@/components/shop/mobile-filter-button";
import { ShopBannerDisplay } from "@/components/shop/shop-banner"; // 👈 2. Importamos el componente visual
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Tienda | Mi Tienda",
  description: "Explora nuestros productos y encuentra lo que buscas.",
};

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function TiendaPage(props: {
  searchParams: SearchParams;
}) {
  const searchParams = await props.searchParams;
  
  // 3. Obtenemos datos en paralelo (Categorías y Banner)
  const categories = await getCategories();
  const bannerData = await getShopBanner(); // 👈 Obtenemos la config del banner

  return (
    <div className="min-h-screen bg-white">
      
      {/* HEADER DE LA SECCIÓN */}
      <div className="border-b border-gray-200 bg-gray-50/50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-wrap justify-between items-end gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
                Nuestros Productos
              </h1>
              <p className="text-gray-500 mt-2 text-lg font-medium">
                Calidad y sabor en cada detalle
              </p>
            </div>
            
            <div className="md:hidden">
              <MobileFilterButton categories={categories} />
            </div>
          </div>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="container mx-auto px-4 py-8">
        
        {/* 🔥 AQUÍ VA EL BANNER (Solo se muestra si está activo en Admin) */}
        <ShopBannerDisplay data={bannerData} />

        <div className="flex flex-col md:flex-row gap-8 lg:gap-12 mt-8">
          
          {/* SIDEBAR */}
          <aside className="hidden md:block w-64 shrink-0">
            <div className="sticky top-24">
              <ShopSidebar categories={categories} />
            </div>
          </aside>

          {/* GRID */}
          <main className="flex-1 min-w-0">
            <Suspense fallback={<LoadingProducts />}>
              <ProductGrid searchParams={searchParams} />
            </Suspense>
          </main>

        </div>
      </div>
    </div>
  );
}

function LoadingProducts() {
  return (
    <div className="w-full h-96 flex flex-col items-center justify-center gap-4 text-gray-400">
      <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      <p className="text-sm font-bold animate-pulse">Cargando catálogo...</p>
    </div>
  );
}