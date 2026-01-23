// src/components/ui/toast.tsx

"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error";

interface ToastProps {
  message: string;
  type: ToastType;
  isVisible: boolean;
  onClose: () => void;
}

export function Toast({ message, type, isVisible, onClose }: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className={cn(
      "fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl px-4 py-3 shadow-2xl transition-all duration-500 animate-in slide-in-from-bottom-5 fade-in",
      type === "success" ? "bg-gray-900 text-white" : "bg-red-500 text-white"
    )}>
      {type === "success" ? <CheckCircle className="h-5 w-5 text-green-400" /> : <XCircle className="h-5 w-5 text-white" />}
      <p className="text-sm font-bold">{message}</p>
      <button onClick={onClose} className="ml-2 rounded-full p-1 hover:bg-white/20">
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
