"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { resendVerificationEmail } from "@/lib/auth-client";
import { auth } from "@/lib/firebase";
import { AlertTriangle, Send, Loader2, CheckCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export function EmailVerificationBanner() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [sent, setSent] = useState(false);

  // Si no hay usuario, ya está verificado en sesión o verificamos localmente, ocultamos
  if (!user || user.emailVerified || isVerified) return null;

  const handleCheck = async () => {
    setIsChecking(true);
    try {
      // Recargamos el usuario en Firebase Auth para obtener el estado más reciente
      await auth.currentUser?.reload();
      
      if (auth.currentUser?.emailVerified) {
        setIsVerified(true); // Ocultamos el banner localmente
        toast.success("¡Email verificado correctamente!");
      } else {
        toast.info("Aún no detectamos la verificación. Intentá de nuevo en unos segundos.");
      }
    } catch (error) {
      toast.error("Error al actualizar estado.");
    } finally {
      setIsChecking(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    const res = await resendVerificationEmail();
    setLoading(false);

    if (res.success) {
      setSent(true);
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
  };

  if (sent) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 mb-6">
        <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-bold text-green-900">¡Correo enviado!</h3>
          <p className="text-sm text-green-700 mt-1">
            Revisá tu bandeja de entrada (y spam) para verificar tu cuenta.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 animate-in fade-in slide-in-from-top-2 mb-6">
      <div className="flex items-start gap-3 flex-1">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-bold text-amber-900">Verificá tu correo electrónico</h3>
          <p className="text-sm text-amber-700 mt-1">
            Para proteger tu cuenta, confirmá tu email <strong>{user.email}</strong>.
          </p>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <button
          onClick={handleCheck}
          disabled={loading || isChecking}
          className="whitespace-nowrap px-4 py-2 bg-white border border-amber-200 text-amber-700 text-sm font-bold rounded-lg hover:bg-amber-50 transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {isChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Ya verifiqué
        </button>

        <button
          onClick={handleResend}
          disabled={loading || isChecking}
          className="whitespace-nowrap px-4 py-2 bg-transparent border border-transparent text-amber-700 text-sm font-bold rounded-lg hover:bg-amber-100/50 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Reenviar
        </button>
      </div>
    </div>
  );
}