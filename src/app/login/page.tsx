"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { AuthGuard } from "@/components/auth/auth-guard";
import { Loader2, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const provider = new GoogleAuthProvider();
      // Forzamos que siempre pida seleccionar cuenta para evitar bucles si hay múltiples sesiones
      provider.setCustomParameters({ prompt: 'select_account' });

      // Solo iniciamos sesión. El AuthGuard detectará el cambio de estado
      // y redirigirá automáticamente a /admin o /tienda según el rol.
      await signInWithPopup(auth, provider);
      
      // No hacemos nada más aquí, esperamos la redirección del Guard.

    } catch (err: any) {
      console.error("Error en login:", err);
      
      // Manejo específico de errores comunes
      if (err.code === 'auth/popup-closed-by-user') {
        setError("Cancelaste el inicio de sesión.");
      } else if (err.code === 'auth/network-request-failed') {
        setError("Error de conexión. Verificá tu internet.");
      } else {
        setError("Ocurrió un error inesperado. Intentá nuevamente.");
      }
      
      setIsLoading(false);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100">
        
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-black tracking-tight text-gray-900">
            Bienvenido
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Ingresá con tu cuenta para continuar
          </p>
        </div>

        {/* Feedback de Error */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 text-red-700 text-sm font-medium animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Botón de Google */}
        <div className="mt-8">
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className={`
              group relative w-full flex justify-center items-center gap-3 py-3.5 px-4 
              border border-gray-200 rounded-2xl bg-white text-sm font-bold text-gray-700 
              hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900 hover:shadow-md
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 
              disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
              transition-all duration-200 ease-in-out
            `}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                  <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
                  <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
                  <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" />
                  <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" />
                </g>
              </svg>
            )}
            <span className="group-hover:text-gray-900 transition-colors">
              {isLoading ? "Iniciando sesión..." : "Continuar con Google"}
            </span>
          </button>
        </div>

        {/* Footer pequeño */}
        <p className="mt-6 text-center text-xs text-gray-400">
          Al continuar, aceptás nuestros términos y condiciones.
        </p>
      </div>
    </div>
    </AuthGuard>
  );
}