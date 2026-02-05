"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { NotificationsList } from "./notifications-list";
import { useAuth } from "@/context/auth-context";

export function NotificationBadge() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      {/* Botón Badge */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
        aria-label="Notificaciones"
      >
        <Bell className="w-5 h-5" />
      </button>

      {/* Modal de Notificaciones */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div
            className="fixed top-12 right-4 z-50 w-96 max-h-96 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <NotificationsList />
          </div>
        </>
      )}
    </>
  );
}