import { Suspense } from "react";
import { getShopBanner, getHomeConfig } from "@/lib/actions/settings"; // 👈 Agregamos getHomeConfig
import { HeroEditor } from "@/components/admin/hero-editor";
import { ShopBannerEditor } from "@/components/admin/shop-banner-editor";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Personalización | Admin",
};

export default async function PersonalizationPage() {
  // 1. Obtenemos los datos del banner
  const bannerData = await getShopBanner();
  
  // 2. 👇 ESTO FALTABA: Obtenemos los datos del Hero (Portada)
  const homeConfig = await getHomeConfig();

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      
      <div>
        <h1 className="text-3xl font-black text-gray-900">Personalización</h1>
        <p className="text-gray-500">Administra el diseño y los anuncios de tu tienda.</p>
      </div>

      {/* SECCIÓN 1: BANNER DE TIENDA */}
      <section>
        <div className="mb-6 flex items-center gap-3">
          <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M3 12a9 9 0 1 0 18 0 9 9 0 1 0-18 0z"/></svg>
          </div>
          <div>
             <h2 className="text-xl font-bold text-gray-900">Banner de Anuncios</h2>
             <p className="text-sm text-gray-500">Aparece en la parte superior de la página de Tienda.</p>
          </div>
        </div>
        
        <Suspense fallback={<Loader2 className="animate-spin" />}>
           <ShopBannerEditor initialData={bannerData} />
        </Suspense>
      </section>

      <hr className="border-gray-200" />

      {/* SECCIÓN 2: HERO DE INICIO */}
      <section>
        <div className="mb-6">
           <h2 className="text-xl font-bold text-gray-900">Portada de Inicio (Hero)</h2>
           <p className="text-sm text-gray-500">Imagen principal de la home.</p>
        </div>
        
        {/* Ahora homeConfig sí existe y no dará error */}
        <HeroEditor initialData={homeConfig?.hero} />
      </section>

    </div>
  );
}