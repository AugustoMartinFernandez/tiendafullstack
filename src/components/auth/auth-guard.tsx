"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Loader2 } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Usuario detectado: Verificar rol y redirigir
        try {
          // Forzamos refresh para asegurar claims actualizados si viene de un login reciente
          const token = await user.getIdTokenResult(true);
          if (token.claims.admin) {
            router.replace("/admin");
          } else {
            router.replace("/tienda");
          }
        } catch (error) {
          console.error("Error checking claims in AuthGuard:", error);
          // Ante error, mandamos a tienda por seguridad
          router.replace("/tienda");
        }
      } else {
        // ✅ Usuario no logueado: Permitir ver el Login
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return <>{children}</>;
}
