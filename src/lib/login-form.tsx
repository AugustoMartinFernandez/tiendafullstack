"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInAndCreateSession, signInWithGoogleAndCreateSession } from "@/lib/auth-client";
import { Loader2, LogIn } from "lucide-react";
import { Toast, ToastType } from "@/components/ui/toast";

interface LoginFormProps {
  redirectTo: string;
  title?: string;
  isAdmin?: boolean;
}

export function LoginForm({ redirectTo, title = "Iniciar Sesión", isAdmin = false }: LoginFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; msg: string; type: ToastType }>({
    show: false,
    msg: "",
    type: "error",
  });

  const showToast = (msg: string, type: ToastType) => {
    setToast({ show: true, msg, type });
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await signInAndCreateSession(email, password, remember);
      if (result.success) {
        showToast(`¡Bienvenido! Redirigiendo...`, "success");
        router.push(redirectTo);
        router.refresh(); // Actualiza componentes de servidor para leer la nueva cookie
      } else {
        showToast(result.message || "Error al iniciar sesión", "error");
        setLoading(false);
      }
    } catch (error) {
      showToast("Ocurrió un error inesperado", "error");
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithGoogleAndCreateSession(remember);
      if (result.success) {
        showToast(`¡Bienvenido! Redirigiendo...`, "success");
        router.push(redirectTo);
        router.refresh();
      } else {
        showToast(result.message || "Error con Google", "error");
        setLoading(false);
      }
    } catch (error) {
      showToast("Error inesperado con Google", "error");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white p-8 rounded-[2rem] shadow-2xl shadow-gray-200/50 border border-gray-100">
      <Toast
        isVisible={toast.show}
        message={toast.msg}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />
      
      <div className="text-center mb-8">
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">{title}</h2>
        <p className="text-sm font-medium text-gray-400 mt-2">Ingresá a tu cuenta para continuar</p>
      </div>

      <form onSubmit={handleEmailLogin} className="space-y-5">
        <div>
          <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-2">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-800 placeholder:text-gray-300"
            placeholder="tu@email.com"
          />
        </div>

        <div>
          <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-2">Contraseña</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-800 placeholder:text-gray-300"
            placeholder="••••••••"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="remember"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          />
          <label htmlFor="remember" className="text-sm font-bold text-gray-600 cursor-pointer select-none">
            Recordarme por 14 días
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-14 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed shadow-xl shadow-indigo-200"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
          {loading ? "Ingresando..." : "Iniciar Sesión"}
        </button>
      </form>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-100"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-widest font-black">
          <span className="px-2 bg-white text-gray-300">O continuá con</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full h-14 flex items-center justify-center gap-3 bg-white border-2 border-gray-100 hover:bg-gray-50 hover:border-gray-200 text-gray-700 font-bold rounded-2xl transition-all active:scale-95 disabled:opacity-70"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Google
      </button>
    </div>
  );
}