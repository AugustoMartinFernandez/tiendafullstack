// src/context/toast-context.tsx
"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { CheckCircle, XCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean }>({
    message: "",
    type: "info",
    visible: false,
  });

  const showToast = (message: string, type: ToastType = "info") => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 3000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Renderizado del Toast Global */}
      <div
        className={cn(
          "fixed bottom-6 right-6 z-[100] flex items-center gap-3 rounded-xl px-5 py-4 shadow-2xl transition-all duration-500 transform",
          toast.visible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0 pointer-events-none",
          toast.type === "success" ? "bg-gray-900 text-white" : 
          toast.type === "error" ? "bg-red-500 text-white" : "bg-indigo-600 text-white"
        )}
      >
        {toast.type === "success" && <CheckCircle className="h-5 w-5 text-green-400" />}
        {toast.type === "error" && <XCircle className="h-5 w-5 text-white" />}
        {toast.type === "info" && <Info className="h-5 w-5 text-white" />}
        <p className="text-sm font-bold">{toast.message}</p>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast debe usarse dentro de un ToastProvider");
  return context;
}
