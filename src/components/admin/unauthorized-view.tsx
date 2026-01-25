"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, LogOut, Store } from "lucide-react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export function UnauthorizedView() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setEmail(user.email);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/login");
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Icono de Alerta */}
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-red-100 shadow-inner">
          <ShieldAlert className="h-12 w-12 text-red-600" />
        </div>

        {/* Textos Informativos */}
        <div className="space-y-3">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight sm:text-3xl leading-tight">
            Acceso Restringido – Solo Administradores
          </h1>
          <p className="text-gray-500 font-medium leading-relaxed">
            No tenés los permisos necesarios para acceder al panel de administración.
          </p>

          {email && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-1.5 text-sm font-medium text-red-800 border border-red-100">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              Usuario: <span className="font-bold">{email}</span>
            </div>
          )}
        </div>

        {/* Botones de Acción */}
        <div className="flex flex-col gap-3 pt-4">
          {/* Opción 1: Cambiar de cuenta (Acción Principal para resolver el problema) */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-4 text-base font-bold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-indigo-300 active:scale-95"
          >
            <LogOut className="h-5 w-5" />
            Ingresar con otra cuenta
          </button>

          {/* Opción 2: Volver al inicio (Acción Secundaria) */}
          <button
            onClick={() => router.push("/")}
            className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-6 py-4 text-base font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95"
          >
            <Store className="h-5 w-5" />
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
}
