// src/components/admin/admin-category-selector.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface AdminCategorySelectorProps {
  categories: string[];
}

export function AdminCategorySelector({ categories }: AdminCategorySelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category") || "";

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const category = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    
    if (category) {
      params.set("category", category);
    } else {
      params.delete("category");
    }
    
    // Reseteamos la paginación al filtrar para evitar estados inconsistentes
    params.delete("cursor");
    params.delete("dir");
    params.delete("page");
    
    router.push(`?${params.toString()}`);
  };

  return (
    <select
      value={currentCategory}
      onChange={handleChange}
      className="h-10 pl-3 pr-8 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer shadow-sm hover:border-indigo-300"
    >
      <option value="">Todas las categorías</option>
      {categories.map((cat) => (
        <option key={cat} value={cat}>
          {cat}
        </option>
      ))}
    </select>
  );
}
