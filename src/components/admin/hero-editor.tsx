"use client";

import { useState } from "react";
import { HomeConfig, updateHomeConfig } from "@/lib/actions/settings";
import { Save, Loader2, UploadCloud, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Image from "next/image";

export function HeroEditor({ initialData }: { initialData: HomeConfig['hero'] }) {
  const defaultHero: NonNullable<HomeConfig['hero']> = {
    title: "",
    subtitle: "",
    badgeText: "",
    buttonText: "",
    buttonUrl: "",
    imageUrl: "",
    overlayOpacity: 0.5,
    titleColor: "#ffffff",
    buttonColor: "#111827",
    buttonTextColor: "#ffffff",
  };
  const [data, setData] = useState<NonNullable<HomeConfig['hero']>>(() => ({
    ...defaultHero,
    ...(initialData || {}),
  }));
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const storageRef = ref(storage, `settings/hero_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setData(prev => ({ ...prev, imageUrl: url }));
      toast.success("Imagen subida correctamente");
    } catch (error) {
      toast.error("Error al subir imagen");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    // casteo para ajustarnos a la firma esperada y evitar error de propiedad 'hero'
    const res = await updateHomeConfig({ hero: data } as any);
    if (res.success) toast.success(res.message);
    else toast.error(res.message);
    setLoading(false);
  };

  return (
    <div className="p-6 space-y-8">
      {/* Preview Visual Simple */}
      <div className="relative h-48 w-full rounded-2xl overflow-hidden bg-gray-900 flex items-center justify-center text-center px-4">
        {data.imageUrl && (
          // Si la imagen viene de un host externo no configurado en next.config.js,
          // evitamos next/image y usamos <img> para no romper la app.
          data.imageUrl.startsWith("http") ? (
            <img src={data.imageUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <Image src={data.imageUrl} alt="Preview" fill className="object-cover" />
          )
        )}
        <div className="absolute inset-0 bg-black" style={{ opacity: data.overlayOpacity }} />
        <div className="relative z-10 space-y-2">
          <span className="inline-block px-2 py-1 rounded text-[10px] font-bold bg-white/20 text-white backdrop-blur-sm">{data.badgeText}</span>
          <h2 className="text-2xl font-black" style={{ color: data.titleColor }}>{data.title}</h2>
          <button className="px-4 py-2 rounded-full text-xs font-bold" style={{ backgroundColor: data.buttonColor, color: data.buttonTextColor }}>
            {data.buttonText}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Textos */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Contenido</h3>
          <div className="space-y-3">
            <input 
              value={data.title} onChange={e => setData({...data, title: e.target.value})}
              placeholder="Título Principal" className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold"
            />
            <input 
              value={data.subtitle} onChange={e => setData({...data, subtitle: e.target.value})}
              placeholder="Subtítulo" className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none"
            />
            <input 
              value={data.badgeText} onChange={e => setData({...data, badgeText: e.target.value})}
              placeholder="Texto Badge (ej: NUEVO)" className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none"
            />
          </div>
        </div>

        {/* Botón y Enlace */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Botón de Acción</h3>
          <div className="space-y-3">
            <input 
              value={data.buttonText} onChange={e => setData({...data, buttonText: e.target.value})}
              placeholder="Texto del Botón" className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold"
            />
            <input 
              value={data.buttonUrl} onChange={e => setData({...data, buttonUrl: e.target.value})}
              placeholder="Enlace (ej: /tienda)" className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none font-mono text-sm"
            />
          </div>
        </div>

        {/* Estilos y Colores */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Estilos</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">Color Título</label>
              <div className="flex items-center gap-2 h-12 px-3 rounded-xl border border-gray-200 bg-white">
                <input type="color" value={data.titleColor} onChange={e => setData({...data, titleColor: e.target.value})} className="h-8 w-8 rounded cursor-pointer border-none p-0" />
                <span className="text-xs font-mono text-gray-500">{data.titleColor}</span>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">Fondo Botón</label>
              <div className="flex items-center gap-2 h-12 px-3 rounded-xl border border-gray-200 bg-white">
                <input type="color" value={data.buttonColor} onChange={e => setData({...data, buttonColor: e.target.value})} className="h-8 w-8 rounded cursor-pointer border-none p-0" />
                <span className="text-xs font-mono text-gray-500">{data.buttonColor}</span>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">Texto Botón</label>
              <div className="flex items-center gap-2 h-12 px-3 rounded-xl border border-gray-200 bg-white">
                <input type="color" value={data.buttonTextColor} onChange={e => setData({...data, buttonTextColor: e.target.value})} className="h-8 w-8 rounded cursor-pointer border-none p-0" />
                <span className="text-xs font-mono text-gray-500">{data.buttonTextColor}</span>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">Opacidad Overlay</label>
              <div className="flex items-center gap-2 h-12 px-3 rounded-xl border border-gray-200 bg-white">
                <input 
                  type="range" min="0" max="1" step="0.1" 
                  value={data.overlayOpacity} onChange={e => setData({...data, overlayOpacity: parseFloat(e.target.value)})} 
                  className="w-full accent-indigo-600"
                />
                <span className="text-xs font-bold w-8 text-right">{data.overlayOpacity}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Imagen */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Imagen de Fondo</h3>
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-2xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {uploading ? (
                <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
              ) : (
                <>
                  <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-xs text-gray-500 font-bold">Click para cambiar imagen</p>
                </>
              )}
            </div>
            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
          </label>
        </div>
      </div>

      {/* Botón Flotante de Guardar */}
      <div className="sticky bottom-4 flex justify-end pt-4">
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-2xl font-bold shadow-xl hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Guardar Cambios
        </button>
      </div>
    </div>
  );
}

// Export por defecto para compatibilidad con imports antiguos
export default HeroEditor;