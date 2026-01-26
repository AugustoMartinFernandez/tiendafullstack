"use client";

import { useAuth } from "@/context/auth-context";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

interface HeroProps {
  title?: string;
  subtitle?: string;
  badgeText?: string;
  buttonText?: string;
  buttonUrl?: string;
  imageUrl?: string;
}

export function Hero({ 
  title = "Tu Estilo, Tu Regla", 
  subtitle = "Descubrí la colección que define quién sos.",
  badgeText = "Nueva Colección",
  buttonText = "Ver Productos",
  buttonUrl = "/tienda",
  imageUrl = "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop"
}: HeroProps) {
  const { user, profile, loading } = useAuth();

  // Personalización basada en el estado de autenticación
  // Usamos el nombre del perfil O la parte del email antes del @ como fallback
  const displayName = profile?.displayName || user?.email?.split('@')[0];
  
  // Mostramos el saludo si hay usuario (incluso si profile está cargando)
  const displayTitle = (user && displayName) 
    ? `¡Hola, ${displayName}!` 
    : (!loading ? title : "..."); // Evita flicker mostrando puntos o el título default

  const displaySubtitle = (!loading && user)
    ? "Nos alegra tenerte de vuelta. Mirá las ofertas especiales que tenemos para vos."
    : subtitle;

  return (
    <div className="relative bg-gray-900 isolate overflow-hidden pt-14">
        {/* Imagen de Fondo con Overlay */}
        <img
            src={imageUrl}
            alt="Banner"
            className="absolute inset-0 -z-10 h-full w-full object-cover opacity-40"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-gray-900 via-gray-900/40" />
        
        {/* Contenido */}
        <div className="mx-auto max-w-7xl px-6 py-32 sm:py-40 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
                {badgeText && (
                    <div className="mb-8 flex justify-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-gray-300 ring-1 ring-white/10 hover:ring-white/20 backdrop-blur-sm">
                            {badgeText} <span className="font-semibold text-yellow-400"><Sparkles className="inline h-3 w-3 mb-0.5"/></span>
                        </div>
                    </div>
                )}
                <h1 className="text-4xl font-black tracking-tight text-white sm:text-6xl animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                    {displayTitle}
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-300 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                    {displaySubtitle}
                </p>
                <div className="mt-10 flex items-center justify-center gap-x-6 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
                    <Link
                        href={buttonUrl}
                        className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 flex items-center gap-2 transition-all hover:scale-105"
                    >
                        {buttonText} <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </div>
        </div>
    </div>
  );
}
