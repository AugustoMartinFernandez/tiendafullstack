"use client";

import { useEffect } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "info";

interface ToastProps {
  isVisible: boolean;
  message: string;
  type?: ToastType;
  onClose: () => void;
  duration?: number;
}

export function Toast({ isVisible, message, type = "info", onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-500" />,
    error: <AlertCircle className="h-5 w-5 text-red-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />,
  };

  const bgColors = {
    success: "bg-white border-green-100 shadow-green-100",
    error: "bg-white border-red-100 shadow-red-100",
    info: "bg-white border-blue-100 shadow-blue-100",
  };

  return (
    <div className={cn(
      "fixed top-4 right-4 z-[100] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl border animate-in slide-in-from-top-5 fade-in duration-300",
      bgColors[type]
    )}>
      {icons[type]}
      <p className="text-sm font-bold text-gray-700">{message}</p>
      <button onClick={onClose} className="ml-2 text-gray-400 hover:text-gray-600 transition-colors">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}