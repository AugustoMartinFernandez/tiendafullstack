"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Loader2, ShieldAlert, LayoutDashboard, Eye } from "lucide-react";

export function UserGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [viewAsUser, setViewAsUser] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Si no hay usuario, mandar al login
        router.replace("/login");
      }
      // Eliminamos la redirección automática de admin aquí para manejarla en el render
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!user) return null;

  // Si es admin y NO ha elegido ver como usuario, mostramos la pantalla de intercepción
  if (profile?.role === "admin" && !viewAsUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-gray-100 text-center space-y-6 animate-in fade-in zoom-in-95">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
            <ShieldAlert className="h-8 w-8 text-indigo-600" />
          </div>
          
          <div>
            <h2 className="text-xl font-black text-gray-900">Hola, Administrador</h2>
            <p className="mt-2 text-sm text-gray-500">
              Estás intentando acceder a una vista de usuario. ¿Qué te gustaría hacer?
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push("/admin")}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-bold text-white hover:bg-gray-800 transition-all"
            >
              <LayoutDashboard className="h-4 w-4" />
              Ir al Panel de Admin
            </button>
            
            <button
              onClick={() => setViewAsUser(true)}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all"
            >
              <Eye className="h-4 w-4" />
              Ver como Usuario
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Banner flotante para recordar que es admin */}
      {profile?.role === "admin" && viewAsUser && (
        <div className="fixed bottom-4 right-4 z-50 bg-gray-900 text-white px-4 py-2 rounded-full shadow-lg text-xs font-bold flex items-center gap-2 animate-in slide-in-from-bottom-5">
          <Eye className="h-3 w-3" />
          Vista Previa de Usuario
          <button onClick={() => setViewAsUser(false)} className="ml-2 underline hover:text-indigo-300">Salir</button>
        </div>
      )}
      {children}
    </>
  );
}