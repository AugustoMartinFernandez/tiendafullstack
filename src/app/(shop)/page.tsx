import { HeroSection } from "@/components/hero/hero-section";
import { AboutSection } from "@/components/marketing/about-section";
import { FaqSection } from "@/components/marketing/faq-section";
import { getHomeConfig } from "@/lib/db";

// Esta configuración le dice a Next.js:
// "Guardá esta página en memoria y no la vuelvas a generar por 1 hora (3600 seg),
// a menos que haya una venta o cambio manual".
// ESTO ES LO QUE TE AHORRA COSTOS DE FIREBASE.
export const revalidate = 3600;

export default async function Home() {
  // 1. Leemos la configuración desde Firebase
  // Si es la primera vez, crea la config por defecto automáticamente.
  const config = await getHomeConfig();

  return (
    <main>
      {/* 1. SECCIÓN HERO (Con datos reales de la DB) */}
      <HeroSection
        badgeText={config.hero.badgeText}
        title={config.hero.title}
        subtitle={config.hero.subtitle}
        buttonText={config.hero.buttonText}
        buttonUrl={config.hero.buttonUrl}
        imageUrl={config.hero.imageUrl}
      />

      {/* 2. SECCIÓN BENEFICIOS (Por ahora fijos, luego los hacemos dinámicos) */}
      <AboutSection
        title="¿Por qué elegirnos?"
        description="Nos enfocamos en la calidad y en brindarte la mejor experiencia."
        features={[
          {
            title: "Envíos Seguros",
            description: "Tu compra viaja protegida hasta tus manos.",
            iconName: "truck",
          },
          {
            title: "Garantía Total",
            description: "Si no es lo que esperabas, lo solucionamos.",
            iconName: "shield",
          },
          {
            title: "Soporte Humano",
            description: "Te atendemos por WhatsApp al instante.",
            iconName: "zap",
          },
        ]}
      />

      {/* 3. SECCIÓN FAQ */}
      <FaqSection
        title="Preguntas Frecuentes"
        items={[
          {
            question: "¿Cómo compro?",
            answer: "Agregá al carrito y completá tus datos. Coordinamos el pago por WhatsApp.",
          },
          {
            question: "¿Medios de pago?",
            answer: "Transferencia o Efectivo. Simple y directo.",
          },
        ]}
      />
    </main>
  );
}