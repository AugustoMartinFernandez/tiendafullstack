"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signInWithEmailAndPassword } from "firebase/auth";
import { signInAndCreateSession, signInWithGoogleAndCreateSession } from "@/lib/auth-client";
import { auth } from "@/lib/firebase";
import { Loader2, LogIn } from "lucide-react";
import { Toast, ToastType } from "@/components/ui/toast";
import { ForgotPasswordModal } from "@/components/auth/forgot-password-modal";
import ReCAPTCHA from "react-google-recaptcha";
import { verifyRecaptcha } from "@/lib/actions/recaptcha";

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
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; msg: string; type: ToastType }>({
    show: false,
    msg: "",
    type: "error",
  });
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

  const showToast = (msg: string, type: ToastType) => {
    setToast({ show: true, msg, type });
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // VALIDACIÓN DE reCAPTCHA (solo para admin)
    if (isAdmin) {
      if (!recaptchaToken) {
        showToast("Por favor completa el reCAPTCHA", "error");
        setLoading(false);
        return;
      }

      try {
        const validation = await verifyRecaptcha(recaptchaToken);
        if (!validation.success) {
          showToast(validation.message, "error");
          setRecaptchaToken(null);
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error("Error verificando reCAPTCHA:", error);
        showToast("Error al verificar reCAPTCHA", "error");
        setLoading(false);
        return;
      }
    }

    // LÓGICA DE INICIO DE SESIÓN
    try {
      // 1. AUTENTICACIÓN EN FIREBASE CLIENT
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. CREAR SESIÓN EN EL SERVIDOR (handshake)
      if (isAdmin) {
        try {
          const idToken = await user.getIdToken();

          const sessionResponse = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ idToken, remember }), // Pasar remember flag
          });

          if (!sessionResponse.ok) {
            const errorData = await sessionResponse.json();
            throw new Error(errorData.message || "Error al crear la sesión en el servidor");
          }
        } catch (sessionError) {
          console.error("Error creando sesión:", sessionError);
          showToast("Error al establecer la sesión. Por favor intenta nuevamente.", "error");
          setLoading(false);
          return;
        }
      }

      // 3. SINCRONIZAR ESTADO DEL SERVIDOR
      router.refresh();

      // 4. MOSTRAR ÉXITO Y REDIRIGIR
      showToast("Inicio de sesión exitoso", "success");
      router.push(redirectTo);
    } catch (error: any) {
      console.error("Error de login:", error);
      const errorMessage =
        error.code === "auth/user-not-found" ? "Usuario no encontrado" :
        error.code === "auth/wrong-password" ? "Contraseña incorrecta" :
        error.code === "auth/invalid-email" ? "Email inválido" :
        error.code === "auth/too-many-requests" ? "Demasiados intentos. Intenta más tarde." :
        error.message || "Error al iniciar sesión";
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithGoogleAndCreateSession(remember);
      if (result.success) {
        // Si es admin, crear sesión en el servidor
        if (isAdmin) {
          try {
            const user = auth.currentUser;
            if (!user) throw new Error("Usuario no autenticado");

            const idToken = await user.getIdToken();

            const sessionResponse = await fetch("/api/auth/login", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ idToken, remember }), // Pasar remember flag
            });

            if (!sessionResponse.ok) {
              const errorData = await sessionResponse.json();
              throw new Error(errorData.message || "Error al crear la sesión");
            }
          } catch (sessionError) {
            console.error("Error creando sesión admin:", sessionError);
            showToast("Error al establecer la sesión. Por favor intenta nuevamente.", "error");
            setLoading(false);
            return;
          }
        }

        showToast(`¡Bienvenido! Redirigiendo...`, "success");
        router.refresh();
        router.push(redirectTo);
      } else {
        showToast(result.message || "Error con Google", "error");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error en Google login:", error);
      showToast("Error inesperado con Google", "error");
      setLoading(false);
    }
  };

  const handleRecaptchaChange = (token: string | null) => {
    setRecaptchaToken(token);
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white p-8 rounded-4xl shadow-2xl shadow-gray-200/50 border border-gray-100">
      <Toast
        isVisible={toast.show}
        message={toast.msg}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />
      
      <ForgotPasswordModal isOpen={isForgotModalOpen} onClose={() => setIsForgotModalOpen(false)} />

      <div className="text-center mb-8">
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">{title}</h2>
        <p className="text-sm font-medium text-gray-400 mt-2">Ingresá a tu cuenta para continuar</p>
      </div>

      <form onSubmit={handleEmailLogin} className="space-y-5">
        <div>
          <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-2">Email</label>
          <input
            type="email"
            autoComplete="email"
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
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-800 placeholder:text-gray-300"
            placeholder="••••••••"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="remember"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <label htmlFor="remember" className="text-sm font-bold text-gray-600 cursor-pointer select-none">
              Recordarme
            </label>
          </div>
          
          <button
            type="button"
            onClick={() => setIsForgotModalOpen(true)}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        {/* reCAPTCHA v2 - Solo para admin */}
        {isAdmin && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg flex justify-center border border-gray-200">
            <ReCAPTCHA
              sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
              onChange={handleRecaptchaChange}
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading || (isAdmin && !recaptchaToken)}
          className="w-full h-14 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed shadow-xl shadow-indigo-200"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
          {loading ? "Ingresando..." : "Iniciar Sesión"}
        </button>

        <div className="text-center mt-4">
          <Link href="/registro" className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
            ¿No tenés cuenta? Crear Cuenta
          </Link>
        </div>
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
