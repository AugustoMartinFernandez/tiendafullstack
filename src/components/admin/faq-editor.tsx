"use client";

import { useState } from "react";
import { updateHomeConfig } from "@/lib/actions/settings";
import { Save, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export function FaqEditor({ initialData }: { initialData: FaqItem[] }) {
  const [faqs, setFaqs] = useState<FaqItem[]>(initialData || []);
  const [loading, setLoading] = useState(false);

  const addFaq = () => {
    setFaqs([...faqs, { id: Date.now().toString(), question: "", answer: "" }]);
  };

  const removeFaq = (id: string) => {
    setFaqs(faqs.filter((f) => f.id !== id));
  };

  const updateFaq = (id: string, field: keyof FaqItem, value: string) => {
    setFaqs(faqs.map((f) => f.id === id ? { ...f, [field]: value } : f));
  };

  const handleSave = async () => {
    setLoading(true);
    const formData = new FormData();
    formData.set("faqs", JSON.stringify(faqs));

    const res = await updateHomeConfig(formData);
    if (res.success) toast.success(res.message);
    else toast.error(res.message);
    setLoading(false);
  };

  return (
    <div className="p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Preguntas Frecuentes</h3>
        <button onClick={addFaq} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors">
          <Plus className="w-4 h-4" /> Agregar
        </button>
      </div>

      <div className="space-y-4">
        {faqs.map((faq) => (
          <div key={faq.id} className="flex gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="flex-1 space-y-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Pregunta</label>
                <input 
                  value={faq.question} onChange={e => updateFaq(faq.id, 'question', e.target.value)}
                  placeholder="¿Hacen envíos?" className="w-full h-10 px-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Respuesta</label>
                <textarea 
                  value={faq.answer} onChange={e => updateFaq(faq.id, 'answer', e.target.value)}
                  placeholder="Sí, a todo el país..." className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm resize-none h-20"
                />
              </div>
            </div>
            <button onClick={() => removeFaq(faq.id)} className="self-start mt-2 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
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