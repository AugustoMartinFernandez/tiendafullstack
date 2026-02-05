import Link from "next/link";
import { ShopBanner } from "@/lib/types";
import { ArrowRight, Megaphone } from "lucide-react";

interface Props {
  data: ShopBanner;
}

export function ShopBannerDisplay({ data }: Props) {
  // Si está apagado, no renderizamos NADA (ni siquiera un div vacío)
  if (!data.isActive) return null;

  return (
    <div className="w-full animate-in slide-in-from-top duration-500 fade-in mb-8">
      <div 
        className="rounded-2xl shadow-xl overflow-hidden relative"
        style={{ backgroundColor: data.backgroundColor, color: data.textColor }}
      >
        {/* Decoración de fondo (Patrón sutil opcional) */}
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none transform translate-x-1/3 -translate-y-1/3">
           <Megaphone size={200} fill="currentColor" />
        </div>

        <div className="relative z-10 px-6 py-8 md:px-10 md:py-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          
          <div className="max-w-2xl">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">
              {data.title}
            </h2>
            {data.description && (
              <p className="mt-2 text-lg font-medium opacity-90 leading-relaxed">
                {data.description}
              </p>
            )}
          </div>

          {/* Botón de Acción (Solo si hay texto y link) */}
          {data.buttonText && data.buttonLink && (
            <Link 
              href={data.buttonLink}
              className="group flex items-center gap-2 px-8 py-3 rounded-full font-bold shadow-lg transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
              style={{ backgroundColor: data.textColor, color: data.backgroundColor }}
            >
              {data.buttonText}
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          )}

        </div>
      </div>
    </div>
  );
}