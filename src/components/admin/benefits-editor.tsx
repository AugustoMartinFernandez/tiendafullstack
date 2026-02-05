"use client";

import { useState } from "react";
import { updateHomeConfig } from "@/lib/actions/settings";
import { Save, Loader2, Plus, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";

interface BenefitItem {
  id: string;
  icon: string;
  title: string;
  description: string;
}

export function BenefitsEditor({ initialData }: { initialData: BenefitItem[] }) {
  const [benefits, setBenefits] = useState<BenefitItem[]>(initialData || []);
  const [loading, setLoading] = useState(false);

  const addBenefit = () => {
    setBenefits([...benefits, { id: Date.now().toString(), icon: "Truck", title: "", description: "" }]);
  };

  const removeBenefit = (id: string) => {
    setBenefits(benefits.filter((b) => b.id !== id));
  };

  const updateBenefit = (id: string, field: keyof BenefitItem, value: string) => {
    setBenefits(benefits.map((b) => b.id === id ? { ...b, [field]: value } : b));
  };

  const handleSave = async () => {
    setLoading(true);
    const formData = new FormData();
    formData.set("benefits", JSON.stringify(benefits));

    const res = await updateHomeConfig(formData);
    if (res.success) toast.success(res.message);
    else toast.error(res.message);
    setLoading(false);
  };

  return (
    <div className="p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Tarjetas de Beneficios</h3>
        <button onClick={addBenefit} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors">
          <Plus className="w-4 h-4" /> Agregar
        </button>
      </div>

      <div className="space-y-4">
        {benefits.map((benefit, index) => (
          <div key={benefit.id} className="flex gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 group">
            <div className="mt-4 text-gray-300 cursor-move">
              <GripVertical className="w-5 h-5" />
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex gap-3">
                <div className="w-1/3">
                  <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Icono (Lucide)</label>
                  <input 
                    value={benefit.icon} onChange={e => updateBenefit(benefit.id, 'icon', e.target.value)}
                    placeholder="Ej: Truck" className="w-full h-10 px-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Título</label>
                  <input 
                    value={benefit.title} onChange={e => updateBenefit(benefit.id, 'title', e.target.value)}
                    placeholder="Ej: Envío Gratis" className="w-full h-10 px-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Descripción</label>
                <input 
                  value={benefit.description} onChange={e => updateBenefit(benefit.id, 'description', e.target.value)}
                  placeholder="Breve explicación..." className="w-full h-10 px-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm"
                />
              </div>
            </div>
            <button onClick={() => removeBenefit(benefit.id)} className="self-center p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>

      <div className="sticky bottom-4 flex justify-end pt-4">
        <button onClick={handleSave} disabled={loading} className="flex items-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-2xl font-bold shadow-xl hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-50">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Guardar Cambios
        </button>
      </div>
    </div>
  );
}