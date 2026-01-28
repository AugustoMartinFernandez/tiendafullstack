"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Loader2 } from "lucide-react";
import { UnauthorizedView } from "./unauthorized-view";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  // Usamos un estado tri-valuado para mayor claridad en el flujo
  const [status, setStatus] = useState<'loading' | 'authorized' | 'unauthorized'>('loading');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // 1. No hay usuario -> Al Login
        router.replace("/login");
        return;
      }

      try {
        // 2. Hay usuario -> Verificar Claim Admin
        // forceRefresh: true es CRÍTICO aquí para seguridad (revocación de roles) y para obtener el claim recién asignado
        const token = await user.getIdTokenResult(true);

  if (token.claims.role === 'admin') {
  setStatus('authorized');
        } else {
          // ⛔ Es Usuario Normal -> Mostrar UI de No Autorizado (No redirigir silenciosamente)
          setStatus('unauthorized');
        }
      } catch (err) {
        console.error("Error de seguridad en AdminGuard:", err);
        // Ante error técnico, denegamos acceso explícitamente
        setStatus('unauthorized');
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Verificando credenciales...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthorized') {
    return <UnauthorizedView />;
  }

  return <>{children}</>;
}
