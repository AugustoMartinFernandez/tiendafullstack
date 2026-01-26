import { auth } from "@/lib/firebase";
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  UserCredential
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