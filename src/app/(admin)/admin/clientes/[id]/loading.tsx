// src/app/(admin)/admin/clientes/[id]/loading.tsx

import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* 1. HERO HEADER SKELETON */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-gray-200 shadow-sm p-6 sm:p-10">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full bg-gray-100 animate-pulse shrink-0 border-4 border-white" />
          
          {/* Info Text */}
          <div className="space-y-4 w-full text-center sm:text-left pt-2">
            <div className="flex flex-col sm:flex-row items-center gap-3 justify-center sm:justify-start">
              <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-6 w-20 bg-gray-100 rounded-full animate-pulse" />
            </div>
            <div className="h-4 w-32 bg-gray-100 rounded-lg animate-pulse mx-auto sm:mx-0" />
            <div className="h-3 w-24 bg-gray-50 rounded-lg animate-pulse mx-auto sm:mx-0 mt-4" />
          </div>
        </div>
      </div>

      {/* 2. KPI CARDS SKELETON */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gray-100 animate-pulse shrink-0" />
            <div className="space-y-2 w-full">
              <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
              <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      {/* 3. TABS & CONTENT SKELETON */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
        {/* Tabs Nav */}
        <div className="flex border-b border-gray-100">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-1 py-4 px-6 flex justify-center">
              <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Tab Content Area */}
        <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1">
           <div className="space-y-6">
              <div className="h-6 w-40 bg-gray-100 rounded animate-pulse" />
              <div className="space-y-4 bg-gray-50 rounded-2xl p-6 border border-gray-100 h-64 animate-pulse" />
           </div>
           <div className="space-y-6">
              <div className="h-6 w-40 bg-gray-100 rounded animate-pulse" />
              <div className="w-full h-64 bg-gray-50 rounded-2xl border border-gray-100 animate-pulse" />
           </div>
        </div>
        
        {/* Spinner central sutil */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Loader2 className="h-10 w-10 text-indigo-600/20 animate-spin" />
        </div>
      </div>
    </div>
  );
}
