"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Filter, X } from "lucide-react";

export function LogsFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [type, setType] = useState(searchParams.get("type") || "ALL");
  const [startDate, setStartDate] = useState(searchParams.get("startDate") || "");

  const handleFilter = () => {
    const params = new URLSearchParams();
    if (type && type !== "ALL") params.set("type", type);
    if (startDate) params.set("startDate", startDate);
    
    router.push(`?${params.toString()}`);
  };

  const handleReset = () => {
    setType("ALL");
    setStartDate("");
    router.push("?");
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-wrap gap-4 items-end">
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo de Evento</label>
        <select 
          value={type} 
          onChange={(e) => setType(e.target.value)}
          className="h-10 border rounded-lg px-3 text-sm min-w-[150px] bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="ALL">Todos</option>
          <option value="INFO">INFO (General)</option>
          <option value="WARN">WARN (Advertencias)</option>
          <option value="ERROR">ERROR (Fallos)</option>
          <option value="SECURITY">SECURITY (Seguridad)</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Desde Fecha</label>
        <input 
          type="date" 
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="h-10 border rounded-lg px-3 text-sm bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>

      <div className="flex gap-2 ml-auto">
        <button 
          onClick={handleReset}
          className="h-10 px-4 flex items-center gap-2 text-gray-500 font-bold text-sm hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" /> Limpiar
        </button>
        <button 
          onClick={handleFilter}
          className="h-10 px-6 flex items-center gap-2 bg-black text-white font-bold text-sm rounded-lg hover:bg-gray-800 transition-all shadow-md"
        >
          <Filter className="w-4 h-4" /> Filtrar
        </button>
      </div>
    </div>
  );
}
