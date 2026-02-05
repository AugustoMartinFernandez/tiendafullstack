import { auth } from "@/lib/firebase";
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  UserCredential,
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile
} from "firebase/auth";

// --- HELPER INTERNO: Crear sesión en el servidor ---
async function createServerSession(userCredential: UserCredential, remember: boolean) {
  const idToken = await userCredential.user.getIdToken();

  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ idToken, remember }),
  });

  if (!response.ok) {
    const data = await response.json();
    // Si falla el servidor, cerramos la sesión del cliente para mantener consistencia
    await signOut(auth);
    throw new Error(data.message || "Error al crear la sesión en el servidor");
  }

  return response.json();
}

// --- LOGIN CON EMAIL Y PASSWORD ---
export async function signInAndCreateSession(email: string, pass: string, remember = false) {
  try {
    // 1. Login en Cliente (Firebase Auth)
    const credential = await signInWithEmailAndPassword(auth, email, pass);
    
    // 2. Crear Cookie de Sesión (Server Side)
    await createServerSession(credential, remember);
    
    return { success: true };
  } catch (error: any) {
    // Solo logueamos como error real si NO es un problema de credenciales (para no ensuciar la consola)
    if (error.code !== "auth/invalid-credential" && error.code !== "auth/user-not-found" && error.code !== "auth/wrong-password") {
      console.error("Error en signInAndCreateSession:", error);
    }

    let message = "Error al iniciar sesión.";
    if (error.code === "auth/invalid-credential") message = "Credenciales incorrectas.";
    if (error.code === "auth/user-not-found") message = "Usuario no encontrado.";
    if (error.code === "auth/wrong-password") message = "Contraseña incorrecta.";
    
    return { success: false, message };
  }
}

// --- REGISTRO CON EMAIL (NUEVO) ---
export async function registerWithEmail(email: string, pass: string, name: string) {
  try {
    // 1. Crear usuario en Firebase Auth
    const credential = await createUserWithEmailAndPassword(auth, email, pass);

    // 2. Actualizar perfil inmediatamente (Nombre)
    // Esto es crucial para que el email de verificación y la UI muestren el nombre correcto
    if (name) {
      await updateProfile(credential.user, { displayName: name });
    }

    // 3. Enviar correo de verificación
    await sendEmailVerification(credential.user);

    // 4. Crear sesión de servidor (Cookie) para UX sin fricción
    await createServerSession(credential, false);

    return { success: true, user: credential.user };
  } catch (error: any) {
    console.error("Error en registerWithEmail:", error);
    let message = "Error al crear la cuenta.";
    if (error.code === "auth/email-already-in-use") message = "Este correo ya está registrado.";
    if (error.code === "auth/weak-password") message = "La contraseña es muy débil (mínimo 6 caracteres).";
    if (error.code === "auth/invalid-email") message = "El formato del correo no es válido.";
    return { success: false, message };
  }
}

// --- LOGIN CON GOOGLE ---
export async function signInWithGoogleAndCreateSession(remember = false) {
  try {
    const provider = new GoogleAuthProvider();
    // 1. Login con Popup
    const credential = await signInWithPopup(auth, provider);
    
    // 2. Crear Cookie de Sesión
    await createServerSession(credential, remember);

    return { success: true };
  } catch (error: any) {
    console.error("Error en signInWithGoogle:", error);
    return { success: false, message: error.message || "Error con Google Auth" };
  }
}

// --- LOGOUT COMPLETO ---
export async function clientLogout() {
  try {
    // 1. Logout del Cliente
    await signOut(auth);

    // 2. Borrar Cookie del Servidor
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    // Recargar la página para limpiar estados de React y Server Components
    // Redirigir al home con un flag para mostrar el mensaje de despedida
    window.location.href = "/?loggedOut=true"; 
  } catch (error) {
    console.error("Error durante logout:", error);
  }
}

// --- RECUPERAR CONTRASEÑA ---
export async function resetPassword(email: string) {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true, message: "Se ha enviado un correo para restablecer tu contraseña." };
  } catch (error: any) {
    console.error("Error en resetPassword:", error);
    let message = "Error al enviar el correo.";
    if (error.code === "auth/user-not-found") message = "No encontramos una cuenta con este email.";
    if (error.code === "auth/invalid-email") message = "El formato del email no es válido.";
    return { success: false, message };
  }
}

// --- REENVIAR VERIFICACIÓN DE EMAIL ---
export async function resendVerificationEmail() {
  try {
    const user = auth.currentUser;
    if (user) {
      await sendEmailVerification(user);
      return { success: true, message: "Correo de verificación enviado." };
    }
    return { success: false, message: "No hay usuario autenticado." };
  } catch (error: any) {
    console.error("Error resending verification:", error);
    let message = "Error al enviar el correo.";
    if (error.code === "auth/too-many-requests") message = "Demasiados intentos. Por favor esperá unos minutos.";
    return { success: false, message };
  }
}