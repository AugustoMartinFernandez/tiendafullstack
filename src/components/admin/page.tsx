import { getHomeConfig } from "@/lib/actions/settings";
import PersonalizationTabs from "@/components/admin/personalization-tabs"; // 👈 FIX 1: Importación por defecto (sin llaves)

export const metadata = {
  title: "Personalizar Home | Admin",
};

export default async function PersonalizationPage() {
  const config = await getHomeConfig();
  
  // Valores por defecto robustos para evitar errores si es la primera vez
  const initialConfig = config || {
    hero: {
      title: "Título Impactante",
      subtitle: "Subtítulo descriptivo de tu negocio",
      badgeText: "NUEVO",
      buttonText: "Ver Productos",
      buttonUrl: "/tienda",
      imageUrl: "",
      overlayOpacity: 0.5,
      titleColor: "#ffffff",
      buttonColor: "#000000",
      buttonTextColor: "#ffffff"
    },
    benefits: [],
    faqs: []
  };

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Personalización del Home</h1>
        <p className="text-sm text-gray-500 font-medium">Gestioná el contenido de tu página de inicio.</p>
      </div>
      {/* 👈 FIX 2: Corregimos el nombre de la prop a 'initialData' */}
      <PersonalizationTabs initialData={initialConfig} />
    </div>
  );
}