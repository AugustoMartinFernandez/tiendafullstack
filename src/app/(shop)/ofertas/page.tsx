import { Suspense } from "react";
import { ProductGrid } from "@/components/shop/product-grid";
import { Loader2, Zap, Clock } from "lucide-react";

export const metadata = {
  title: "Ofertas y Liquidación | Doña Jovita",
  description: "Aprovecha nuestros descuentos por tiempo limitado.",
};

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function OfertasPage(props: {
  searchParams: SearchParams;
}) {
  const searchParams = await props.searchParams;

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* 1. HEADER (Rojo/Naranja) */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-12 md:py-16 text-center">
          
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-bold mb-6 border border-white/30 shadow-lg">
            <Clock className="w-4 h-4 animate-pulse" />
            <span>Tiempo Limitado</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4 drop-shadow-md">
            ¡Oportunidades Únicas!
          </h1>
          <p className="text-lg md:text-xl font-medium text-red-100 max-w-2xl mx-auto leading-relaxed">
            Productos seleccionados con descuentos especiales. 
            <br className="hidden md:block"/>
            Llévatelos antes de que vuelvan a su precio original.
          </p>
        </div>
      </div>

      {/* 2. CONTENIDO (Sin fondo blanco detrás) */}
      <div className="container mx-auto px-4 py-12">
        
        {/* Título de la sección limpio */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-white text-red-600 rounded-lg shadow-sm border border-red-100">
            <Zap className="w-6 h-6 fill-current" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">
            Descuentos Activos
          </h2>
        </div>

        <Suspense fallback={<LoadingOffers />}>
          {/* 👇 El Grid ahora flota libremente */}
          <ProductGrid searchParams={searchParams} forceOffers={true} />
        </Suspense>

      </div>
    </div>
  );
}

function LoadingOffers() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-400">
      <Loader2 className="w-10 h-10 animate-spin text-red-600" />
      <p className="text-sm font-bold text-gray-500">Buscando las mejores ofertas...</p>
    </div>
  );
}