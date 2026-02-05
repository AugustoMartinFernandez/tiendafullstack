// src/app/(shop)/page.tsx

import { getHomeConfig } from "@/lib/actions/settings";
import { HeroSection } from "@/components/hero/hero-section";
import { AboutSection } from "@/components/marketing/about-section";
import { FaqSection } from "@/components/marketing/faq-section";

// Esto hace que la página se actualice cada hora (o cuando hagas un cambio en admin)
export const revalidate = 3600;

export default async function ShopHomePage() {
  // 1. LEER LOS DATOS DE FIREBASE
  const config = await getHomeConfig();

  // 2. PREPARAR DATOS (Si no hay nada guardado, usa estos por defecto)
  const hero = config?.hero || {
    title: "Bienvenido a mi Tienda",
    subtitle: "Los mejores productos están acá",
    badgeText: "NUEVO",
    buttonText: "Ver Productos",
    buttonUrl: "/tienda",
    imageUrl: "/placeholder.jpg",
  };

  const benefits = config?.benefits?.length ? config.benefits : [
    { id: "1", title: "Envío Seguro", description: "Protegemos tu paquete", icon: "Truck" }
  ];

  // Mapeo de iconos a los valores esperados por AboutSection
  const mapIcon = (icon?: string): "truck" | "shield" | "zap" => {
    const name = (icon || "").toLowerCase();
    if (name.includes("truck") || name.includes("envío") || name.includes("shipping")) return "truck";
    if (name.includes("shield") || name.includes("seguro") || name.includes("security")) return "shield";
    if (name.includes("zap") || name.includes("bolt") || name.includes("rápido") || name.includes("fast")) return "zap";
    return "truck";
  };

  const faqs = config?.faqs?.length ? config.faqs : [];

  return (
    <main>
      {/* SECCIÓN HERO CONECTADA */}
      <HeroSection
        badgeText={hero.badgeText}
        title={hero.title}
        subtitle={hero.subtitle}
        buttonText={hero.buttonText}
        buttonUrl={hero.buttonUrl}
        imageUrl={hero.imageUrl}
      />

      {/* BENEFICIOS CONECTADOS */}
      <AboutSection
        title="Beneficios"
        description="Lo que nos hace únicos"
        features={benefits.map(b => ({
          title: b.title,
          description: b.description,
          iconName: mapIcon(b.icon),
        }))}
      />

      {/* FAQ CONECTADAS */}
      <FaqSection
        title="Preguntas Frecuentes"
        items={faqs.map(f => ({
          question: f.question,
          answer: f.answer
        }))}
      />
    </main>
  );
}