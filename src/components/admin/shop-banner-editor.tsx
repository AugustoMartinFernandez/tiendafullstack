"use client";

import { useState, useTransition } from "react";
import { ShopBanner } from "@/lib/types";
import { updateShopBanner } from "@/lib/actions/settings";
import { toast } from "sonner";
import { Loader2, Save, Sparkles, AlertCircle, CheckCircle, Zap } from "lucide-react";

interface Props {
  initialData: ShopBanner;
}

// Presets psicológicos para marketing
const MARKETING_PRESETS = [
  { name: "Urgencia / Oferta", bg: "#dc2626", text: "#ffffff", icon: <Zap size={14} /> },
  { name: "Confianza / Info", bg: "#2563eb", text: "#ffffff", icon: <AlertCircle size={14} /> },
  { name: "Éxito / Nuevo", bg: "#16a34a", text: "#ffffff", icon: <CheckCircle size={14} /> },
  { name: "Lujo / Black", bg: "#111827", text: "#ffffff", icon: <Sparkles size={14} /> },
];

export function ShopBannerEditor({ initialData }: Props) {
  const [data, setData] = useState<ShopBanner>(initialData);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    startTransition(async () => {
      const res = await updateShopBanner(data);
      if (res.success) toast.success("Banner actualizado correctamente");
      else toast.error("Error al guardar");
    });
  };

  return (
    <div className="space-y-8">
      
      {/* 1. VISTA PREVIA EN VIVO (Live Preview) */}
      <div className="border border-gray-200 rounded-xl p-6 bg-gray-50">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
          Vista Previa en Tienda
        </h3>
        
        {/* Simulación del Banner */}
        <div 
          className={`rounded-lg p-6 shadow-sm transition-all duration-300 flex flex-col md:flex-row items-center justify-between gap-4 ${!data.isActive ? 'opacity-50 grayscale' : ''}`}
          style={{ backgroundColor: data.backgroundColor, color: data.textColor }}
        >
          <div className="text-center md:text-left">
            <h4 className="text-xl font-black tracking-tight">{data.title || "Título del Banner"}</h4>
            <p className="opacity-90 mt-1 font-medium">{data.description || "Descripción de la oferta..."}</p>
          </div>
          
          {data.buttonText && (
            <button 
              className="px-6 py-2 rounded-full font-bold shadow-lg transform transition-transform active:scale-95 text-sm"
              style={{ backgroundColor: data.textColor, color: data.backgroundColor }}
            >
              {data.buttonText}
            </button>
          )}
        </div>
        {!data.isActive && <p className="text-center text-xs text-red-500 mt-2 font-bold">Actualmente Oculto</p>}
      </div>

      {/* 2. FORMULARIO DE EDICIÓN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Columna Izquierda: Contenido */}
        <div className="space-y-6 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900">Contenido</h3>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-sm font-medium text-gray-600">Activar Banner</span>
              <input 
                type="checkbox" 
                checked={data.isActive}
                onChange={(e) => setData({ ...data, isActive: e.target.checked })}
                className="w-10 h-6 rounded-full bg-gray-200 checked:bg-indigo-600 appearance-none transition-colors relative checked:after:translate-x-4 after:content-[''] after:absolute after:top-1 after:left-1 after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-transform"
              />
            </label>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Título Principal</label>
              <input 
                value={data.title}
                onChange={(e) => setData({ ...data, title: e.target.value })}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                placeholder="Ej: ¡Oferta Relámpago!"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Subtítulo / Descripción</label>
              <textarea 
                value={data.description}
                onChange={(e) => setData({ ...data, description: e.target.value })}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Ej: Solo por hoy, 20% off en todo."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Texto Botón (Opcional)</label>
                <input 
                  value={data.buttonText || ""}
                  onChange={(e) => setData({ ...data, buttonText: e.target.value })}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none text-sm"
                  placeholder="Ej: Ver Ofertas"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Link Botón</label>
                <input 
                  value={data.buttonLink || ""}
                  onChange={(e) => setData({ ...data, buttonLink: e.target.value })}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none text-sm"
                  placeholder="Ej: /tienda"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Estilo y Acciones */}
        <div className="space-y-6 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900">Estilo y Marketing</h3>
          
          {/* Presets de Color */}
          <div className="grid grid-cols-2 gap-2">
            {MARKETING_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => setData({ ...data, backgroundColor: preset.bg, textColor: preset.text })}
                className="flex items-center gap-2 p-2 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors text-xs font-bold text-gray-700"
              >
                <div className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: preset.bg }} />
                {preset.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
            <div>
               <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Color Fondo</label>
               <div className="flex items-center gap-2">
                 <input 
                   type="color" 
                   value={data.backgroundColor}
                   onChange={(e) => setData({ ...data, backgroundColor: e.target.value })}
                   className="w-10 h-10 rounded-lg cursor-pointer border-none p-0"
                 />
                 <span className="text-xs font-mono text-gray-500">{data.backgroundColor}</span>
               </div>
            </div>
            <div>
               <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Color Texto</label>
               <div className="flex items-center gap-2">
                 <input 
                   type="color" 
                   value={data.textColor}
                   onChange={(e) => setData({ ...data, textColor: e.target.value })}
                   className="w-10 h-10 rounded-lg cursor-pointer border-none p-0"
                 />
                 <span className="text-xs font-mono text-gray-500">{data.textColor}</span>
               </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={isPending}
            className="w-full mt-4 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isPending ? <Loader2 className="animate-spin" /> : <Save size={20} />}
            Guardar Configuración
          </button>
        </div>
      </div>
    </div>
  );
}