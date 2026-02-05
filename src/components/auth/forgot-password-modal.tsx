"use client";

import { useState, Fragment, useEffect } from "react";
import { Dialog, Transition, TransitionChild, DialogPanel, DialogTitle } from "@headlessui/react";
import { X, Mail, Loader2, Send } from "lucide-react";
import { resetPassword } from "@/lib/auth-client";
import { toast } from "sonner";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { verifyRecaptcha } from "@/lib/actions/recaptcha";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function ForgotPasswordModal({ isOpen, onClose }: Props) {
  const { executeRecaptcha } = useGoogleReCaptcha();
  
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Gestión del Cooldown (Cuenta regresiva)
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Validación de Email en tiempo real
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);
    setIsTouched(true);
    // Regex simple pero efectiva para validación visual
    setIsValid(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones previas
    if (!email || !isValid || cooldown > 0) return;

    setLoading(true);

    try {
      // 1. Obtener Token de reCAPTCHA
      if (!executeRecaptcha) {
        toast.error("El servicio de seguridad no está listo. Intenta recargar.");
        setLoading(false);
        return;
      }

      const token = await executeRecaptcha("password_reset");

      // 2. Verificar Token en el Servidor
      const verification = await verifyRecaptcha(token);

      if (!verification.success) {
        toast.error(verification.message || "Error de seguridad.");
        setLoading(false);
        return;
      }

      // 3. Ejecutar la acción de negocio (Firebase)
      const res = await resetPassword(email);

      if (res.success) {
        toast.success(res.message);
        setCooldown(60); // Activar cooldown de 60s
        onClose();
        // Limpieza parcial (mantenemos cooldown activo en el componente si se vuelve a abrir)
        setEmail("");
        setIsValid(false);
        setIsTouched(false);
      } else {
        toast.error(res.message);
      }

    } catch (error) {
      console.error("Error en el proceso de recuperación:", error);
      toast.error("Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-3xl bg-white p-8 text-left align-middle shadow-2xl transition-all border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                  <DialogTitle as="h3" className="text-xl font-black text-gray-900 leading-6 tracking-tight">
                    Recuperar Contraseña
                  </DialogTitle>
                  <button
                    onClick={onClose}
                    className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-2">
                  <p className="text-sm text-gray-500 mb-6 font-medium">
                    Ingresá tu correo electrónico y te enviaremos un enlace seguro para restablecer tu contraseña.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={handleEmailChange}
                        className={`w-full pl-11 pr-4 py-3.5 rounded-xl border bg-gray-50/50 focus:bg-white focus:ring-4 outline-none transition-all text-gray-900 placeholder-gray-400 font-medium ${
                          isTouched && !isValid 
                            ? "border-red-300 focus:ring-red-500/10 focus:border-red-500" 
                            : "border-gray-200 focus:ring-indigo-500/10 focus:border-indigo-500"
                        }`}
                        placeholder="tu@email.com"
                      />
                      {isTouched && !isValid && (
                        <p className="absolute -bottom-5 left-1 text-[10px] font-bold text-red-500 animate-in slide-in-from-top-1">
                          Ingresá un email válido
                        </p>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-3.5 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-xl transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={loading || !isValid || cooldown > 0}
                        className={`flex-1 py-3.5 px-4 font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg ${
                          cooldown > 0 
                            ? "bg-gray-400 text-white cursor-not-allowed shadow-none" 
                            : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 disabled:opacity-70"
                        }`}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Cargando...</span>
                          </>
                        ) : cooldown > 0 ? (
                          <span>Reenviar en {cooldown}s</span>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            <span>Enviar</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
