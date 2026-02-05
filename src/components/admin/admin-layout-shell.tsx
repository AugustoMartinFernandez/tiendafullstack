"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import AdminSidebar from "./admin-sidebar";

export function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* MOBILE NAVBAR (Hidden on desktop) */}
      <div className="md:hidden sticky top-0 z-20 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">Panel Admin</h1>
        <button
          aria-label="Toggle sidebar"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          {sidebarOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* MOBILE SIDEBAR (Drawer overlay on mobile) */}
      {sidebarOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-10 bg-black/40"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="md:hidden fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 overflow-y-auto mt-16">
            <AdminSidebar />
          </aside>
        </>
      )}

      {/* DESKTOP SIDEBAR (Fixed on desktop) */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:border-gray-200 md:bg-white md:h-screen md:sticky md:top-0">
        <AdminSidebar />
      </aside>

      {/* MAIN CONTENT */}
      <main className="grow overflow-auto">
        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}