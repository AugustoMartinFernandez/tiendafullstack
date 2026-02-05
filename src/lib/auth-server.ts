import "server-only";
import { cookies } from "next/headers";
import { authAdmin } from "./firebase-admin";

/**
 * Requiere que el usuario sea administrador.
 * Lanza una excepción si no hay sesión válida.
 */
export async function requireAdmin() {
  const cookieStore = await cookies();

  // Sincronizado: Buscar cookie "session" (sin guiones bajos)
  const sessionCookie = cookieStore.get("session")?.value;

  if (!sessionCookie) {
    throw new Error("Unauthorized: No session cookie found");
  }

  try {
    // Verificar que la sesión es válida
    const decodedClaims = await authAdmin.verifySessionCookie(sessionCookie, true);
    return decodedClaims;
  } catch (error) {
    console.error("Error verificando sesión admin:", error);
    throw new Error("Sesión inválida");
  }
}

/**
 * Requiere que el usuario esté autenticado.
 * Retorna null si no hay sesión válida (en lugar de lanzar excepción).
 */
export async function requireUser() {
  const cookieStore = await cookies();

  // Buscar cookie "session"
  const sessionCookie = cookieStore.get("session")?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    // Verificar que la sesión es válida
    const decodedClaims = await authAdmin.verifySessionCookie(sessionCookie, true);
    return decodedClaims;
  } catch (error) {
    console.error("Error verificando sesión usuario:", error);
    return null;
  }
}
